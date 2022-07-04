import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import { idByWork, workById } from "~/enums/workTypes";
import getAllUsers from "./getAllUsers.server";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parse";

const getBarGraphData = ({
  x,
  contributor,
  contribution,
}: {
  x: "count" | "month" | "tags";
  contributor: string;
  contribution:
    | "all"
    | "tasks"
    | "projects"
    | "replies"
    | "wiki"
    | "initiatives";
}) => {
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      (contribution === "all"
        ? cxn.execute(
            `SELECT 
        w.id, 
        w.date_closed, 
        w.work_type,
        w.assignee_id,
        w.author_id,
        w.reviewer_id 
      FROM work w`
          )
        : contribution === "replies" || contribution === "wiki"
        ? Promise.resolve([])
        : cxn.execute(
            `SELECT 
        w.id, 
        w.date_closed, 
        w.work_type,
        w.assignee_id,
        w.author_id,
        w.reviewer_id 
      FROM work w WHERE w.work_type = ?`,
            [
              idByWork[
                `${contribution.slice(0, 1).toUpperCase()}${contribution
                  .slice(1, -1)
                  .toLowerCase()}`
              ],
            ]
          )
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
            date: r.date_closed,
            type: workById[r.work_type],
            contributors: [r.assignee_id, r.author_id, r.reviewer_id].filter(
              Boolean
            ),
          }))
        ),
      getAllUsers(cxn.execute),
      (contribution === "wiki" || contribution === "replies"
        ? Promise.resolve([])
        : cxn.execute(
            `SELECT 
        c.user_id, 
        c.work_id
      FROM contributors c`
          )
      )
        .then((a) => a as { user_id: string; work_id: string }[])
        .then((a) =>
          a.map((r) => ({
            user: r.user_id,
            work: r.work_id,
          }))
        ),
      (contribution === "all" || contribution === "replies"
        ? cxn.execute(`SELECT r.id, r.author_id, r.date FROM replies r`)
        : Promise.resolve([])
      ).then((a) => a as { author_id: string; id: string; date: Date }[]),
      (contribution === "all" || contribution === "wiki"
        ? cxn.execute(
            `SELECT w.id, w.created_by, w.count, w.day
      FROM wiki_contributions w`
          )
        : Promise.resolve([])
      ).then(
        (a) =>
          a as { created_by: string; id: string; count: number; day: Date }[]
      ),
      (x === "tags"
        ? cxn.execute(
            `SELECT w.tag, w.work, t.name
        FROM tag_work w
        INNER JOIN tags t ON t.id = w.tag`
          )
        : Promise.resolve([])
      ).then((a) => a as { tag: string; work: string; name: string }[]),
    ]).then(([work, users, contributors, replies, wikis, tags]) => {
      cxn.destroy();
      const relevantContributions =
        contributor === "everyone"
          ? new Set<string>()
          : new Set(
              contributors
                .filter((w) => w.user === contributor)
                .map((w) => w.work)
            );
      const filteredWork =
        contributor === "everyone"
          ? work
          : work.filter(
              (d) =>
                relevantContributions.has(d.id) ||
                d.contributors.includes(contributor)
            );
      const filteredReplies =
        contributor === "everyone"
          ? replies
          : replies.filter((d) => d.author_id === contributor);
      const filteredWikis =
        contributor === "everyone"
          ? wikis
          : wikis.filter((d) => d.created_by === contributor);
      if (x === "count") {
        const reducedWork = filteredWork.reduce((p, c) => {
          const key = c.type;
          if (p[key]) {
            p[key].push(c.id);
          } else {
            p[key] = [c.id];
          }
          return p;
        }, {} as Record<"Task" | "Project" | "Initiative" | "Replies" | "Wikis", string[]>);
        reducedWork["Replies"] = filteredReplies.map((r) => r.id);
        const countData = Object.fromEntries(
          Object.entries(reducedWork).map(([k, v]) => [k, v.length])
        );
        countData["Wikis"] = filteredWikis.reduce((p, c) => p + c.count, 0);
        const data = Object.entries(countData).map(([label, amount]) => ({
          label,
          data: [
            {
              type: "contributions",
              amount,
            },
          ],
        }));
        return {
          data,
          users,
          contributor,
          x,
          contribution,
        };
      } else if (x === "month") {
        const amountByMonth: Record<string, Record<string, number>> = {};
        const monthSet = new Set<string>();
        filteredWork.forEach((w) => {
          const month = dateFormat(w.date, "MM/yyyy");
          monthSet.add(month);
          if (amountByMonth[month]) {
            if (amountByMonth[month][w.type]) {
              amountByMonth[month][w.type]++;
            } else {
              amountByMonth[month][w.type] = 1;
            }
          } else {
            amountByMonth[month] = { [w.type]: 1 };
          }
        });
        filteredReplies.forEach((w) => {
          const month = dateFormat(w.date, "MM/yyyy");
          monthSet.add(month);
          if (amountByMonth[month]) {
            if (amountByMonth[month]["Replies"]) {
              amountByMonth[month]["Replies"]++;
            } else {
              amountByMonth[month]["Replies"] = 1;
            }
          } else {
            amountByMonth[month] = { ["Replies"]: 1 };
          }
        });
        filteredWikis.forEach((w) => {
          const month = dateFormat(w.day, "MM/yyyy");
          monthSet.add(month);
          if (amountByMonth[month]) {
            if (amountByMonth[month]["Wikis"]) {
              amountByMonth[month]["Wikis"]++;
            } else {
              amountByMonth[month]["Wikis"] = 1;
            }
          } else {
            amountByMonth[month] = { ["Wikis"]: 1 };
          }
        });
        const months = Array.from(monthSet).sort(
          (a, b) =>
            dateParse(a, "MM/yyyy", new Date()).valueOf() -
            dateParse(b, "MM/yyyy", new Date()).valueOf()
        );
        const data = ["Task", "Project", "Initiative", "Replies", "Wikis"].map(
          (label) => ({
            label,
            data: months.map((type) => ({
              type,
              amount: amountByMonth[type][label] || 0,
            })),
          })
        );
        return {
          data,
          users,
          contributor,
          x,
          contribution,
        };
      } else {
        // x === "tags"
        const amountByTag: Record<string, Record<string, number>> = {};
        const tagSet = new Set<string>();
        filteredWork.forEach((w) => {
          tags
            .filter((t) => t.work === w.id)
            .forEach((t) => {
              tagSet.add(t.name);
              if (amountByTag[t.name]) {
                if (amountByTag[t.name][w.type]) {
                  amountByTag[t.name][w.type]++;
                } else {
                  amountByTag[t.name][w.type] = 1;
                }
              } else {
                amountByTag[t.name] = { [w.type]: 1 };
              }
            });
        });
        const allTags = Array.from(tagSet).sort();
        const data = ["Task", "Project", "Initiative", "Replies", "Wikis"].map(
          (label) => ({
            label,
            data: allTags.map((type) => ({
              type,
              amount: amountByTag[type][label] || 0,
            })),
          })
        );
        return {
          data,
          users,
          contributor,
          x,
          contribution,
        };
      }
    })
  );
};

export default getBarGraphData;
