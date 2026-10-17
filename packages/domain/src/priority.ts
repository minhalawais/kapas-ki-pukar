export const priorities = ["Emergency", "Critical", "High", "Standard"] as const;
export type Priority = (typeof priorities)[number];

export const priorityRank: Record<Priority, number> = {
  Standard: 0,
  High: 1,
  Critical: 2,
  Emergency: 3,
};

export function higherPriority(a: Priority, b: Priority): Priority {
  return priorityRank[a] >= priorityRank[b] ? a : b;
}
