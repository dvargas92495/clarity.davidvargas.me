import getMysqlConnection, {
  Execute,
} from "@dvargas92495/app/backend/mysql.server";
import AWS from "aws-sdk";
import type mysql from "mysql2";
import FILE_TYPES from "~/enums/fileTypes";
import WORK_TYPES, { idByWork, workById } from "~/enums/workTypes";
import { z } from "zod";

const s3 = new AWS.S3({ region: process.env.AWS_REGION });
const zProject = () =>
  z
    .object({
      id: z.string(),
      projectId: z.number(),
      name: z.string(),
      dateCreated: z.string(),
      dateClosed: z.string(),
      assigneeId: z.string().nullable(),
      workType: z.enum(
        [WORK_TYPES[0].name, ...WORK_TYPES.slice(1).map((w) => w.name)]
        // WORK_TYPES.map((w) => w.name)
        // Typescript: Source provides no match for required element at position 0 in target
        // English: `.map` produces a string[], which is technically not guaranteed to have a first element
        // despite `WORK_TYPES` being a constant
      ),
      authorId: z.string(),
      reviewerId: z.string().nullable(),
      contributorIds: z.string(),
      tags: z.string().array().optional(),
    })
    .array();

const insertDeletedUsers = (execute: Execute, deletedUsers: string[]) =>
  execute(
    `INSERT INTO users (id, username, avatar, name) VALUES ${deletedUsers
      .map(() => `(?, ?, ?, ?)`)
      .join(",")} ON DUPLICATE KEY UPDATE id=id`,
    deletedUsers.flatMap((u) => [u, "DELETED", "404", "DELETED"])
  ).then((r) =>
    console.log(
      "changed",
      (r as mysql.ResultSetHeader).changedRows,
      "users",
      "affected",
      (r as mysql.ResultSetHeader).affectedRows,
      "users"
    )
  );

const bulkInsertData = ({
  schema,
  filename,
}: {
  schema: typeof FILE_TYPES[number]["id"];
  filename: string;
}) => {
  return Promise.all([
    s3
      .getObject({ Bucket: "clarity.davidvargas.me", Key: filename })
      .promise()
      .then((r) => {
        try {
          return JSON.parse(r.Body?.toString() || "[]");
        } catch (e) {
          return Promise.reject(e);
        }
      }),
    getMysqlConnection(),
  ])
    .then(([args, cxn]) => {
      if (schema === "users") {
        const allUsers = z
          .object({
            id: z.string(),
            username: z.string(),
            avatar: z.string(),
            name: z.string().nullable(),
          })
          .array()
          .parse(args);
        return cxn
          .execute(
            `INSERT INTO users (id, username, avatar, name) VALUES ${allUsers
              .map(() => `(?, ?, ?, ?)`)
              .join(
                ","
              )} ON DUPLICATE KEY UPDATE username=VALUES(username), avatar=VALUES(avatar), name=VALUES(name)`,
            allUsers.flatMap((u) => [u.id, u.username, u.avatar, u.name])
          )
          .then((r) => {
            cxn.destroy();
            console.log(
              "changed",
              (r as mysql.ResultSetHeader).changedRows,
              "users",
              "affected",
              (r as mysql.ResultSetHeader).affectedRows,
              "users"
            );
          });
      } else if (schema === "projects") {
        const work = zProject().parse(args);
        const deletedUsers = Array.from(
          new Set(
            work.flatMap((w) =>
              [w.assigneeId, w.authorId, w.reviewerId].concat(
                JSON.parse(w.contributorIds)
              )
            )
          )
        ).filter(Boolean) as string[];
        return insertDeletedUsers(cxn.execute, deletedUsers)
          .then(() =>
            cxn
              .execute(
                `INSERT INTO work (id, project_id, name, date_created, date_closed, assignee_id, work_type, author_id, reviewer_id) VALUES ${work
                  .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                  .join(",")} ON DUPLICATE KEY UPDATE 
              project_id=VALUES(project_id), name=VALUES(name), 
              date_created=VALUES(date_created), date_closed=VALUES(date_closed), 
              assignee_id=VALUES(assignee_id), work_type=VALUES(work_type), 
              author_id=VALUES(author_id), reviewer_id=VALUES(reviewer_id)`,
                work.flatMap((w) => [
                  w.id,
                  w.projectId,
                  w.name,
                  new Date(w.dateCreated),
                  new Date(w.dateClosed),
                  w.assigneeId,
                  idByWork[w.workType],
                  w.authorId,
                  w.reviewerId,
                ])
              )
              .then((r) =>
                console.log(
                  "Changed",
                  (r as mysql.ResultSetHeader).changedRows,
                  "work",
                  "Added",
                  (r as mysql.ResultSetHeader).affectedRows,
                  "work"
                )
              )
          )
          .then(() =>
            cxn
              .execute(
                `INSERT INTO contributors (id, user_id, work_id) VALUES ${work
                  .flatMap((w) =>
                    JSON.parse(w.contributorIds).flatMap(() => `(UUID(), ?, ?)`)
                  )
                  .join(",")} ON DUPLICATE KEY UPDATE id=id`,
                work.flatMap((w) =>
                  z
                    .string()
                    .array()
                    .parse(JSON.parse(w.contributorIds))
                    .flatMap((c) => [c, w.id])
                )
              )
              .then((r) =>
                console.log(
                  "Updated",
                  (r as mysql.ResultSetHeader).changedRows,
                  "contributors",
                  "Added",
                  (r as mysql.ResultSetHeader).affectedRows,
                  "contributors"
                )
              )
          )
          .then(() => {
            cxn.destroy();
            return Promise.resolve();
          });
      } else if (schema === "tags") {
        const { tagsDict: tags, completedProjects: work } = z
          .object({
            completedProjects: zProject(),
            tagsDict: z.record(z.object({ id: z.string(), name: z.string() })),
          })
          .parse(args);
        return cxn
          .execute(
            `INSERT INTO tags (id, name) VALUES ${Object.keys(tags)
              .map(() => `(?, ?)`)
              .join(",")} ON DUPLICATE KEY UPDATE name=name`,
            Object.values(tags)
              .map((t) => [t.id, t.name])
              .flat()
          )
          .then(() => {
            return cxn.execute(
              `INSERT INTO tag_work (uuid, tag, work) VALUES ${work
                .flatMap((w) => (w.tags || []).map(() => `(UUID(), ?, ?)`))
                .join(",")} ON DUPLICATE KEY UPDATE work=work`,
              work
                .flatMap((w) =>
                  (w.tags || []).map((t) => [
                    t.replace(/^Document/, "").replace(/^Work/, ""),
                    w.id,
                  ])
                )
                .flat()
            );
          })
          .then(() => {
            cxn.destroy();
            return Promise.resolve();
          });
      } else if (schema === "replies") {
        const replies = z
          .object({
            id: z.string(),
            authorId: z.string(),
            dateCreated: z.string(),
            discussionId: z.string(),
            isRootOfDiscussion: z.boolean(),
          })
          .array()
          .parse(args);
        const deletedUsers = Array.from(
          new Set(replies.map((w) => w.authorId))
        ).filter(Boolean);
        return insertDeletedUsers(cxn.execute, deletedUsers)
          .then(() =>
            cxn.execute(
              `INSERT INTO replies (id, author_id, date, discussion_id, is_root_of_discussion) VALUES ${replies
                .map(() => `(?, ?, ?, ?, ?)`)
                .join(",")} ON DUPLICATE KEY UPDATE 
            author_id=VALUES(author_id), date=VALUES(date), 
            discussion_id=VALUES(discussion_id), is_root_of_discussion=VALUES(is_root_of_discussion)`,
              replies.flatMap((u) => [
                u.id,
                u.authorId,
                new Date(u.dateCreated),
                u.discussionId,
                Number(u.isRootOfDiscussion),
              ])
            )
          )
          .then((r) => {
            cxn.destroy();
            console.log(
              "changed",
              (r as mysql.ResultSetHeader).changedRows,
              "users",
              "affected",
              (r as mysql.ResultSetHeader).affectedRows,
              "users"
            );
          });
      } else if (schema === "wiki") {
        const wikiContributions = z
          .object({
            wikiPageId: z.string(),
            createdBy: z.string(),
            day: z.string().transform((s) => new Date(s)),
            count: z.number(),
          })
          .array()
          .parse(args);
        const deletedUsers = Array.from(
          new Set(wikiContributions.map((w) => w.createdBy))
        ).filter(Boolean);
        return insertDeletedUsers(cxn.execute, deletedUsers).then(() =>
          cxn
            .execute(
              `INSERT INTO wiki_contributions (id, wiki_page_id, created_by, day, count) VALUES ${wikiContributions
                .map(() => `(UUID(), ?, ?, ?, ?)`)
                .join(",")} ON DUPLICATE KEY UPDATE 
            wiki_page_id=VALUES(wiki_page_id), created_by=VALUES(created_by), 
            day=VALUES(day), count=VALUES(count)`,
              wikiContributions.flatMap((u) => [
                u.wikiPageId,
                u.createdBy,
                u.day,
                u.count,
              ])
            )
            .then((r) => {
              cxn.destroy();
              console.log(
                "changed",
                (r as mysql.ResultSetHeader).changedRows,
                "users",
                "affected",
                (r as mysql.ResultSetHeader).affectedRows,
                "users"
              );
            })
        );
      } else {
        cxn.destroy();
        return Promise.reject(`Unknown upload schema: ${schema}`);
      }
    })
    .then(() => ({ success: true, message: "Successfully uploaded file!" }))
    .catch((e) => ({ success: false, message: e.message }));
};

export default bulkInsertData;
