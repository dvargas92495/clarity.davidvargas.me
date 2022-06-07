import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import { workById } from "../enums/workTypes";

const getWorkData = () => {
  return getMysqlConnection().then((cxn) =>
    cxn
      .execute(
        `SELECT w.id, w.date_closed, w.work_type, w.author_id, u.name as user, t.name as tag
        FROM work w 
        LEFT JOIN tag_work wt ON wt.work = w.id
        LEFT JOIN tags t ON wt.tag = t.id
        LEFT JOIN users u ON u.id = w.author_id`
      )
      .then(
        (a) =>
          a as {
            id: string;
            date_closed: Date;
            work_type: number;
            author_id: string;
            user: string;
            tag: string;
          }[]
      )
      .then((a) =>
        a.map((r) => ({
          id: r.id,
          date: r.date_closed.toJSON(),
          type: workById[r.work_type],
          authorId: r.author_id,
          tag: r.tag,
          user: r.user,
        }))
      )
  );
};

export default getWorkData;
