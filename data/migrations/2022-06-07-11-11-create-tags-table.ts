import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import type { MigrationProps } from "fuegojs/dist/migrate";

export const migrate = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    connection.execute(
      `CREATE TABLE IF NOT EXISTS tags (
    id        VARCHAR(36)  NOT NULL,
    name      VARCHAR(191) NULL,

    PRIMARY KEY (id)
)`
    )
  );
};

export const revert = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    connection.execute(`DROP TABLE tags`)
  );
};
