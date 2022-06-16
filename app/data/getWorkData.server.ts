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
        FROM work w`
      )
      .then(
        (a) =>
          a as {
            id: string;
            date_closed: Date;
            work_type: number;
          }[]
      )
      .then((a) =>
        a.map((r) => ({
          id: r.id,
          date: r.date_closed.toJSON(),
          type: workById[r.work_type],
        }))
      )
  );
};

export default getWorkData;
