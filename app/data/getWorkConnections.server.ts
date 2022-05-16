import getMysqlConnection from "@dvargas92495/app/backend/mysql.server";

const getWorkConnections = () => {
  return getMysqlConnection().then((cxn) =>
    Promise.all([
      cxn.execute(
        `SELECT w.id, w.assignee_id, w.author_id, w.reviewer_id, c.user_id as contributor_id FROM work w LEFT JOIN contributors c ON c.work_id = w.id`
      ),
      cxn.execute(`SELECT id, name, avatar FROM users`),
    ])
      .then(([links, nodes]) => ({
        links: links as {
          id: string;
          assignee_id: string | null;
          author_id: string | null;
          reviewer_id: string | null;
          contributor_id: string | null;
        }[],
        nodes: nodes as { id: string; name: string; avatar: string }[],
      }))
      .then((a) => {
        return {
          links: Array.from(
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
          }),
          nodes: a.nodes,
        };
      })
  );
};

export default getWorkConnections;
