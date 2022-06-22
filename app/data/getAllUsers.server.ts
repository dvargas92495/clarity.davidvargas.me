import type { Execute } from "@dvargas92495/app/backend/mysql.server";

const getAllUsers = (execute: Execute) => {
  return execute(`SELECT id, name, username FROM users`)
    .then(
      (a) =>
        a as {
          id: string;
          name: string;
          username: string;
        }[]
    )
    .then((_users) => {
      const users = [{ id: "everyone", label: "Everyone" }].concat(
        _users
          .map((u) => ({ id: u.id, label: u.name || u.username }))
          .sort((a, b) => a.label.localeCompare(b.label))
      );
      return users;
    });
};

export default getAllUsers;
