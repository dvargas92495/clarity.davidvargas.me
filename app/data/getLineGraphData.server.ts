import getMysqlConnection, {
  Execute,
} from "@dvargas92495/app/backend/mysql.server";
import { idByWork, workById } from "~/enums/workTypes";
import getAllUsers from "./getAllUsers.server";
import dateFormat from "date-fns/format";
import { z } from "zod";
import { NotFoundResponse } from "@dvargas92495/app/backend/responses.server";
import subMonths from "date-fns/subMonths";
import isBefore from "date-fns/isBefore";

export type Interval = "week" | "month" | "quarter";
const schema = z.object({
  tag: z.string().default("all"),
  contributor: z.string().default("everyone"),
  contribution: z
    .enum(["all", "tasks", "projects", "replies", "wiki", "goals"])
    .default("all"),
  interval: z.enum(["week", "month", "quarter"]).default("month"),
  timespan: z.enum(["all", "12", "9", "6", "3"]).default("all"),
});

const intervalFormats = {
  month: "MM/yyyy",
  quarter: "QQ/yyyy",
  week: "II/yyyy",
};

const intervalLength = {
  month: 12,
  quarter: 4,
  week: 52,
};

const getAllTags = (execute: Execute) =>
  execute(
    `SELECT t.name
FROM tags t`,
    []
  ).then((a) => ["all"].concat((a as { name: string }[]).map((a) => a.name)));

const getBarGraphData = (args: Record<string, string>) => {
  try {
    const { contributor, tag, contribution, interval, timespan } =
      schema.parse(args);
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
      ]).then(
        ([work, users, contributors, replies, wikis, linkedTags, tags]) => {
          cxn.destroy();
          const minDate =
            timespan === "all"
              ? new Date(0)
              : subMonths(new Date(), Number(timespan));
          const relevantContributions =
            contributor === "everyone"
              ? new Set<string>()
              : new Set(
                  contributors
                    .filter((w) => w.user === contributor)
                    .map((w) => w.work)
                );
          const filteredWorkByContributor = (
            contributor === "everyone"
              ? work
              : work.filter(
                  (d) =>
                    relevantContributions.has(d.id) ||
                    d.contributors.includes(contributor)
                )
          ).filter((w) => !isBefore(w.date, minDate));
          const taggedWorkSet = new Set(linkedTags.map((t) => t.work));
          const filteredWork =
            tag === "all"
              ? filteredWorkByContributor
              : filteredWorkByContributor.filter((f) =>
                  taggedWorkSet.has(f.id)
                );

          const filteredReplies = (
            tag !== "all"
              ? []
              : contributor === "everyone"
              ? replies
              : replies.filter((d) => d.author_id === contributor)
          ).filter((w) => !isBefore(w.date, minDate));
          const filteredWikis = (
            tag !== "all"
              ? []
              : contributor === "everyone"
              ? wikis
              : wikis.filter((d) => d.created_by === contributor)
          ).filter((w) => !isBefore(w.day, minDate));
          const amountByInterval: Record<string, number> = {};
          const intervalSet = new Set<string>();
          filteredWork.forEach((w) => {
            const key = dateFormat(w.date, intervalFormats[interval]);
            intervalSet.add(key);
            if (amountByInterval[key]) {
              amountByInterval[key]++;
            } else {
              amountByInterval[key] = 1;
            }
          });
          filteredReplies.forEach((w) => {
            const key = dateFormat(w.date, intervalFormats[interval]);
            intervalSet.add(key);
            if (amountByInterval[key]) {
              amountByInterval[key]++;
            } else {
              amountByInterval[key] = 1;
            }
          });
          filteredWikis.forEach((w) => {
            const key = dateFormat(w.day, intervalFormats[interval]);
            intervalSet.add(key);
            if (amountByInterval[key]) {
              amountByInterval[key]++;
            } else {
              amountByInterval[key] = 1;
            }
          });
          const len = intervalLength[interval];
          const { minKey, maxKey } = Array.from(intervalSet)
            .map((m) => m.split("/").map((k) => Number(k)))
            .map(([i, y]) => i - 1 + y * len)
            .reduce(
              (p, c) => ({
                minKey: c < p.minKey ? c : p.minKey,
                maxKey: c > p.maxKey ? c : p.maxKey,
              }),
              {
                minKey: Number.MAX_SAFE_INTEGER,
                maxKey: 0,
              }
            );
          const keys = intervalSet.size
            ? Array(maxKey - minKey + 1)
                .fill(null)
                .map((_, s) => {
                  const m = s + minKey;
                  const key = m % len;
                  const year = (m - key) / len;
                  return `${(key + 1).toString().padStart(2, "0")}/${year}`;
                })
            : [];
          const data = [
            {
              label: contribution,
              data: keys.map((type) => ({
                type,
                amount: amountByInterval[type] || 0,
              })),
            },
          ];
          return {
            data,
            users,
            contributor,
            tag,
            tags,
            contribution,
            interval,
            timespan,
          };
        }
      )
    );
  } catch (e) {
    throw new NotFoundResponse("Invalid search parameters entered");
  }
};

export default getBarGraphData;
