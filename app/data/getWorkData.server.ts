import getMysqlConnection from "@dvargas92495/api/mysql";

const getWorkData = () => {
  return getMysqlConnection().then((cxn) =>
    cxn
      .execute(`SELECT id, date_closed FROM work`)
      .then((a) => a as { id: string; date_closed: Date }[])
      .then((a) => a.map((r) => ({ id: r.id, date: r.date_closed.toJSON() })))
  );
};

export default getWorkData;
