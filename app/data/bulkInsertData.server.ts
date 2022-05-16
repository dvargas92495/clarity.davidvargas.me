import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import AWS from "aws-sdk";
import type mysql from "mysql2";
import { idByWork } from "~/enums/workTypes";

const s3 = new AWS.S3();

const bulkInsertData = ({
  users,
  projects,
}: {
  users: string;
  projects: string;
}) => {
  return Promise.all([
    s3
      .getObject({ Bucket: "clarity.davidvargas.me", Key: projects })
      .promise()
      .then((r) => JSON.parse(r.Body?.toString() || "[]") as {
        id: string;
        projectId: number;
        name: string;
        dateCreated: string;
        dateClosed: string;
        assigneeId: string;
        workType: "Task" | "Project";
        authorId: string;
        reviewerId: string;
        contributorIds: string;
      }[]),
    s3
      .getObject({ Bucket: "clarity.davidvargas.me", Key: users })
      .promise()
      .then((r) => JSON.parse(r.Body?.toString() || "[]") as {
        id: string;
        username: string;
        avatar: string;
        name: string;
      }[]),
  ]).then(([p, us]) => {
    const work = p.map((u) => ({
      ...u,
      contributorIds: JSON.parse(u.contributorIds) as string[],
    }));
    const userIds = new Set(us.map((u) => u.id));
    const deletedUsers = Array.from(
      new Set(
        work
          .flatMap((w) =>
            [w.assigneeId, w.authorId, w.reviewerId].concat(w.contributorIds)
          )
          .filter((u) => u && !userIds.has(u))
      )
    );
    const allUsers = us.concat(
      deletedUsers.map((id) => ({
        id,
        username: "DELETED",
        avatar: "404",
        name: "DELETED",
      }))
    );
    return getMysqlConnection()
      .then((connection) =>
        connection
          .execute(
            `INSERT INTO users (id, username, avatar, name) VALUES ${allUsers
              .map(() => `(?, ?, ?, ?)`)
              .join(
                ","
              )} ON DUPLICATE KEY UPDATE username=username, avatar=avatar, name=name`,
            allUsers.flatMap((u) => [u.id, u.username, u.avatar, u.name])
          )
          .then((r) =>
            console.log(
              "changed",
              (r as mysql.ResultSetHeader).changedRows,
              "users",
              "affected",
              (r as mysql.ResultSetHeader).affectedRows,
              "users"
            )
          )
          .then(() =>
            connection
              .execute(
                `INSERT INTO work (id, project_id, name, date_created, date_closed, assignee_id, work_type, author_id, reviewer_id) VALUES ${work
                  .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                  .join(",")} ON DUPLICATE KEY UPDATE 
                  project_id=project_id, name=name, 
                  date_created=date_created, date_closed=date_closed, 
                  assignee_id=assignee_id, work_type=work_type, 
                  author_id=author_id, reviewer_id=reviewer_id`,
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
            connection
              .execute(
                `INSERT INTO contributors (id, user_id, work_id) VALUES ${work
                  .flatMap((w) =>
                    w.contributorIds.flatMap(() => `(UUID(), ?, ?)`)
                  )
                  .join(",")} ON DUPLICATE KEY UPDATE id=id`,
                work.flatMap((w) => w.contributorIds.flatMap((c) => [c, w.id]))
              )
              .then((r) =>
                console.log(
                  "Updated",
                  (r as mysql.ResultSetHeader).affectedRows,
                  "contributors",
                  "Added",
                  (r as mysql.ResultSetHeader).affectedRows,
                  "contributors"
                )
              )
          )
      )
      .catch((e) => {
        console.error("Migration failed:");
        console.error(e);
      });
  });
};

export default bulkInsertData;
