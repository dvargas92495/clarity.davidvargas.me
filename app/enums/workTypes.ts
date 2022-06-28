const WORK_TYPES = [
  { id: 1, name: "Task" },
  { id: 2, name: "Project" },
  { id: 3, name: "Initiative" },
] as const;

export const workById = Object.fromEntries(
  WORK_TYPES.map((w) => [w.id, w.name])
);

export const idByWork = Object.fromEntries(
  WORK_TYPES.map((w) => [w.name, w.id])
);

export default WORK_TYPES;
