import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";

const getWorkConnections = ({
  contributor,
}: {
  contributor: string | null;
}) => {
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      cxn.execute(
        `SELECT w.id, w.assignee_id, w.author_id, w.reviewer_id, c.user_id as contributor_id FROM work w LEFT JOIN contributors c ON c.work_id = w.id`
      ),
      cxn.execute(`SELECT id, name, avatar, username FROM users`),
    ])
      .then(([links, nodes]) => ({
        links: links as {
          id: string;
          assignee_id: string | null;
          author_id: string | null;
          reviewer_id: string | null;
          contributor_id: string | null;
        }[],
        nodes: nodes as {
          id: string;
          name: string;
          avatar: string;
          username: string;
        }[],
      }))
      .then((a) => {
        const mappedLinks = Array.from(
          new Set(
            a.links
              .flatMap((link) => {
                const pairs = [
                  [link.assignee_id, link.author_id],
                  [link.assignee_id, link.reviewer_id],
                  [link.assignee_id, link.contributor_id],
                  [link.author_id, link.reviewer_id],
                  [link.author_id, link.contributor_id],
                  [link.reviewer_id, link.contributor_id],
                ]
                  .filter((pair) => pair.every((node) => !!node))
                  .filter(([source, target]) => source !== target);
                return pairs.map((nodes) => ({
                  nodes: nodes.sort(),
                  id: link.id,
                }));
              })
              .map((s) => `${s.id}|${s.nodes.join("|")}`)
          )
        ).map((serialized) => {
          const [id, source, target] = serialized.split("|");
          return { id, source, target };
        });
        const focusedContributor = contributor || "everyone";
        const users = [{ id: "everyone", label: "Everyone" }].concat(
          a.nodes
            .map((u) => ({ id: u.id, label: u.name || u.username }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
        const links =
          focusedContributor === "everyone"
            ? mappedLinks
            : mappedLinks.filter(
                (l) => l.source === contributor || l.target === contributor
              );
        const usersInLinks =
          focusedContributor === "everyone"
            ? new Set<string>()
            : new Set(links.flatMap((l) => [l.source, l.target]));
        return {
          links,
          nodes:
            focusedContributor === "everyone"
              ? a.nodes
              : a.nodes.filter((u) => usersInLinks.has(u.id)),
          users,
          contributor: focusedContributor,
        };
      })
  );
};

export default getWorkConnections;
