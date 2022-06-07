import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import type { MigrationProps } from "fuegojs/dist/migrate";

export const migrate = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    connection.execute(
      `CREATE TABLE IF NOT EXISTS tag_work (
    uuid      VARCHAR(36)  NOT NULL,
    tag       VARCHAR(36)  NOT NULL,
    work      VARCHAR(191) NOT NULL,

    PRIMARY KEY (uuid)
    FOREIGN KEY (tag) REFERENCES tags(id),
    FOREIGN KEY (work) REFERENCES work(id)
)`
    )
  );
};

export const revert = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    connection.execute(`DROP TABLE tag_work`)
  );
};
