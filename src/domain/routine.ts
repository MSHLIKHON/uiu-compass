export interface RoutineEntry {
  id: string;
  course: string;
  section: string;
  exam: string;
  day: string;
  time: string;
  room: string;
}

export function routineLabel(entry: RoutineEntry) {
  return `${entry.day.trim().toLowerCase()}|${entry.time.trim().toLowerCase()}`;
}

export function routineConflicts(entries: RoutineEntry[]) {
  const groups = new Map<string, RoutineEntry[]>();
  for (const entry of entries) {
    const key = routineLabel(entry);
    if (key === "|") continue;
    groups.set(key, [...(groups.get(key) ?? []), entry]);
  }
  return [...groups.values()].filter((group) => group.length > 1);
}

export function sortRoutine(entries: RoutineEntry[]) {
  return [...entries].sort((a, b) =>
    `${a.day} ${a.time} ${a.course}`.localeCompare(
      `${b.day} ${b.time} ${b.course}`,
    ),
  );
}
