import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";
import type { MigrationProps } from "fuegojs/dist/migrate";

export const migrate = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    Promise.all([
      connection.execute(
        `CREATE TABLE IF NOT EXISTS replies (
          id                     VARCHAR(36)  NOT NULL, 
          author_id              VARCHAR(36)  NOT NULL, 
          date                   DATETIME(3)  NOT NULL, 
          discussion_id          VARCHAR(36)  NOT NULL, 
          is_root_of_discussion  TINYINT(1)   NOT NULL,

    PRIMARY KEY (id),
    FOREIGN KEY (author_id) REFERENCES users(id)
)`
      ),
      connection.execute(
        `CREATE TABLE IF NOT EXISTS wiki_contributions (
          id                     VARCHAR(36)  NOT NULL, 
          created_by             VARCHAR(36)  NOT NULL, 
          day                    DATETIME(3)  NOT NULL, 
          wiki_page_id           VARCHAR(36)  NOT NULL, 
          count                  INT          NOT NULL,

          PRIMARY KEY (id),
          FOREIGN KEY (created_by) REFERENCES users(id)
)`
      ),
    ])
  );
};

export const revert = (args: MigrationProps) => {
  return getMysqlConnection(args.connection).then((connection) =>
    Promise.all([
      connection.execute(`DROP TABLE replies`),
      connection.execute(`DROP TABLE wiki_contributions`),
    ])
  );
};
