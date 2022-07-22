const WORK_TYPES = [
  { id: 1, name: "Task" },
  { id: 2, name: "Project" },
  { id: 3, name: "Goal" },
] as const;

export const workById = Object.fromEntries(
  WORK_TYPES.map((w) => [w.id, w.name])
);

export const idByWork = Object.fromEntries(
  WORK_TYPES.map((w) => [w.name, w.id])
);

export type ContributionType = `${Lowercase<(typeof WORK_TYPES[number]['name'])>}s` | "all" | "wiki" | "replies"

export default WORK_TYPES;
