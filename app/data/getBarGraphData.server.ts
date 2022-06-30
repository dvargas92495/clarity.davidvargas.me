import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import { workById } from "~/enums/workTypes";
import getAllUsers from "./getAllUsers.server";
import dateFormat from "date-fns/format";

const getBarGraphData = (contributor: string) => {
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      cxn
        .execute(
          `SELECT 
        w.id, 
        w.date_closed, 
        w.work_type,
        w.assignee_id,
        w.author_id,
        w.reviewer_id 
      FROM work w`
        )
        .then(
          (a) =>
            a as {
              id: string;
              date_closed: Date;
              work_type: number;
              author_id: string;
              assignee_id: string;
              reviewer_id: string;
            }[]
        )
        .then((a) =>
          a.map((r) => ({
            id: r.id,
            date: r.date_closed.toJSON(),
            type: workById[r.work_type],
            contributors: [r.assignee_id, r.author_id, r.reviewer_id].filter(
              Boolean
            ),
          }))
        ),
      getAllUsers(cxn.execute),
      cxn
        .execute(
          `SELECT 
        c.user_id, 
        c.work_id
      FROM contributors c`
        )
        .then((a) => a as { user_id: string; work_id: string }[])
        .then((a) =>
          a.map((r) => ({
            user: r.user_id,
            work: r.work_id,
          }))
        ),
    ]).then(([data, users, contributors]) => {
      cxn.destroy();
      const relevantContributions =
        contributor === "everyone"
          ? new Set<string>()
          : new Set(
              contributors
                .filter((w) => w.user === contributor)
                .map((w) => w.work)
            );
      const filteredData =
        contributor === "everyone"
          ? data
          : data.filter(
              (d) =>
                relevantContributions.has(d.id) ||
                d.contributors.includes(contributor)
            );
      return {
        data: filteredData.reduce((p, c) => {
          const key = c.type;
          const item = { id: c.id };
          if (p[key]) {
            p[key].push(item);
          } else {
            p[key] = [item];
          }
          return p;
        }, {} as Record<"Task" | "Project" | "Initiative", { id: string }[]>),
        users,
        contributor,
      };
    })
  );
};

export default getBarGraphData;
