import getMysqlConnection, {
  Execute,
} from "@dvargas92495/app/backend/mysql.server";
import { ContributionType, idByWork, workById } from "~/enums/workTypes";
import getAllUsers from "./getAllUsers.server";
import dateFormat from "date-fns/format";
import dateParse from "date-fns/parse";

const getAllTags = (execute: Execute) =>
  execute(
    `SELECT t.name
FROM tags t`,
    []
  ).then((a) => ["all"].concat((a as { name: string }[]).map((a) => a.name)));

const getBarGraphData = ({
  tag,
  contributor,
  contribution,
}: {
  tag: string;
  contributor: string;
  contribution: ContributionType;
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
      (tag !== "all"
        ? cxn.execute(
            `SELECT w.tag, w.work, t.name
        FROM tag_work w
        INNER JOIN tags t ON t.id = w.tag
        WHERE t.name = ?`,
            [tag]
          )
        : cxn.execute(
            `SELECT w.tag, w.work, t.name
      FROM tag_work w
      INNER JOIN tags t ON t.id = w.tag`,
            []
          )
      ).then((a) => a as { tag: string; work: string; name: string }[]),
      getAllTags(cxn.execute),
    ]).then(([work, users, contributors, replies, wikis, linkedTags, tags]) => {
      cxn.destroy();
      const relevantContributions =
        contributor === "everyone"
          ? new Set<string>()
          : new Set(
              contributors
                .filter((w) => w.user === contributor)
                .map((w) => w.work)
            );
      const filteredWorkByContributor =
        contributor === "everyone"
          ? work
          : work.filter(
              (d) =>
                relevantContributions.has(d.id) ||
                d.contributors.includes(contributor)
            );
      const taggedWorkSet = new Set(linkedTags.map((t) => t.work));
      const filteredWork =
        tag === "all"
          ? filteredWorkByContributor
          : filteredWorkByContributor.filter((f) => taggedWorkSet.has(f.id));

      const filteredReplies =
        tag !== "all"
          ? []
          : contributor === "everyone"
          ? replies
          : replies.filter((d) => d.author_id === contributor);
      const filteredWikis =
        tag !== "all"
          ? []
          : contributor === "everyone"
          ? wikis
          : wikis.filter((d) => d.created_by === contributor);
      const amountByMonth: Record<string, number> = {};
      const monthSet = new Set<string>();
      filteredWork.forEach((w) => {
        const month = dateFormat(w.date, "MM/yyyy");
        monthSet.add(month);
        if (amountByMonth[month]) {
          amountByMonth[month]++;
        } else {
          amountByMonth[month] = 1;
        }
      });
      filteredReplies.forEach((w) => {
        const month = dateFormat(w.date, "MM/yyyy");
        monthSet.add(month);
        if (amountByMonth[month]) {
          amountByMonth[month]++;
        } else {
          amountByMonth[month] = 1;
        }
      });
      filteredWikis.forEach((w) => {
        const month = dateFormat(w.day, "MM/yyyy");
        monthSet.add(month);
        if (amountByMonth[month]) {
          amountByMonth[month]++;
        } else {
          amountByMonth[month] = 1;
        }
      });
      const months = Array.from(monthSet).sort(
        (a, b) =>
          dateParse(a, "MM/yyyy", new Date()).valueOf() -
          dateParse(b, "MM/yyyy", new Date()).valueOf()
      );
      const data = [{
        label: contribution,
        data: months.map((type) => ({
          type,
          amount: amountByMonth[type] || 0,
        })),
      }];
      return {
        data,
        users,
        contributor,
        tag,
        tags,
        contribution,
      };
    })
  );
};

export default getBarGraphData;
