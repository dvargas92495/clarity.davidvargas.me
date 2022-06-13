import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import { workById } from "../enums/workTypes";

const getWorkData = () => {
  return getMysqlConnection().then((cxn) =>
    cxn
      .execute(
        `SELECT 
          w.id, 
          w.date_closed, 
          w.work_type, 
          u.name as author_name, 
          u.username as author_username, 
          uu.name as assignee_name, 
          uu.username as assignee_username, 
          t.name as tag
        FROM work w 
        LEFT JOIN tag_work wt ON wt.work = w.id
        LEFT JOIN tags t ON wt.tag = t.id
        LEFT JOIN users u ON u.id = w.author_id
        LEFT JOIN users uu ON u.id = w.assignee_id`
      )
      .then(
        (a) =>
          a as {
            id: string;
            date_closed: Date;
            work_type: number;
            author_name?: string;
            author_username: string;
            assignee_name?: string;
            assignee_username: string;
            tag: string;
          }[]
      )
      .then((a) =>
        a.map((r) => ({
          id: r.id,
          date: r.date_closed.toJSON(),
          type: workById[r.work_type],
          author: r.author_name || `@${r.author_username}`,
          assignee: r.assignee_name || `@${r.assignee_username}`,
          tag: r.tag,
        }))
      )
  );
};

export default getWorkData;
