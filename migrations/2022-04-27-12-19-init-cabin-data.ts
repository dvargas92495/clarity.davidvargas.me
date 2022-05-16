import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import axios from "axios";
import type { MigrationProps } from "fuegojs/dist/migrate";
import { idByWork } from "~/enums/workTypes";
import type mysql from "mysql2";

export const migrate = (args: MigrationProps) => {
  return Promise.all([
    axios.get("https://clarity.davidvargas.me/data/closed-projects.json"),
    axios.get("https://clarity.davidvargas.me/data/usersWithId.json"),
  ]).then(([p, u]) => {
    const work = (
      p.data as {
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
      }[]
    ).map((u) => ({
      ...u,
      contributorIds: JSON.parse(u.contributorIds) as string[],
    }));
    const users = u.data as {
      id: string;
      username: string;
      avatar: string;
      name: string;
    }[];
    const userIds = new Set(users.map((u) => u.id));
    const deletedUsers = Array.from(
      new Set(
        work
          .flatMap((w) =>
            [w.assigneeId, w.authorId, w.reviewerId].concat(w.contributorIds)
          )
          .filter((u) => u && !userIds.has(u))
      )
    );
    const allUsers = users.concat(
      deletedUsers.map((id) => ({
        id,
        username: "DELETED",
        avatar: "404",
        name: "DELETED",
      }))
    );
    return getMysqlConnection(args.connection)
      .then((connection) =>
        connection
          .execute(
            `CREATE TABLE IF NOT EXISTS users (
        id        VARCHAR(36)  NOT NULL,
        username  VARCHAR(64)  NOT NULL,
        avatar    VARCHAR(191) NOT NULL,
        name      VARCHAR(191) NULL,

        PRIMARY KEY (id)
    )`
          )
          .then(() =>
            connection.execute(`CREATE TABLE IF NOT EXISTS work (
      id           VARCHAR(36)  NOT NULL,
      project_id   INT          NOT NULL,
      name         VARCHAR(191) NOT NULL,
      date_created DATETIME(3)  NOT NULL,
      date_closed  DATETIME(3)  NOT NULL,
      assignee_id  VARCHAR(36)  NULL,
      work_type    TINYINT(3)   NOT NULL,
      author_id    VARCHAR(36)  NOT NULL,
      reviewer_id  VARCHAR(36)  NULL,

      PRIMARY KEY (id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      FOREIGN KEY (author_id) REFERENCES users(id),
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
  )`)
          )
          .then(() =>
            connection.execute(`CREATE TABLE IF NOT EXISTS contributors (
            id      VARCHAR(36)  NOT NULL,
            user_id VARCHAR(36)  NOT NULL,
            work_id VARCHAR(36)  NOT NULL,

      PRIMARY KEY (id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (work_id) REFERENCES work(id)
  )`)
          )
          .then(() =>
            connection
              .execute(
                `INSERT INTO users (id, username, avatar, name) VALUES ${allUsers
                  .map(() => `(?, ?, ?, ?)`)
                  .join(",")}`,
                allUsers.flatMap((u) => [u.id, u.username, u.avatar, u.name])
              )
              .then((r) =>
                console.log(
                  "Added",
                  (r as mysql.ResultSetHeader).affectedRows,
                  "users"
                )
              )
          )
          .then(() =>
            connection
              .execute(
                `INSERT INTO work (id, project_id, name, date_created, date_closed, assignee_id, work_type, author_id, reviewer_id) VALUES ${work
                  .map(() => `(?, ?, ?, ?, ?, ?, ?, ?, ?)`)
                  .join(",")}`,
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
                  .join(",")}`,
                work.flatMap((w) => w.contributorIds.flatMap((c) => [c, w.id]))
              )
              .then((r) =>
                console.log(
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

export const revert = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    connection
      .execute(`DROP TABLE contributors`)
      .then(() => connection.execute(`DROP TABLE work`))
      .then(() => connection.execute(`DROP TABLE users`))
  );
};
