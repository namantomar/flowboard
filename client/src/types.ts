export type CardStatus = "todo" | "in_progress" | "done";
export type CardPriority = "Low" | "Medium" | "High";

export interface Card {
  id: string;
  title: string;
  description: string;
  priority: CardPriority;
  status: CardStatus;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CardInput {
  title: string;
  description: string;
  priority: CardPriority;
  status: CardStatus;
  dueDate: string | null;
}

export interface Stats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  byPriority: Record<CardPriority, number>;
}

export const COLUMNS: Array<{ status: CardStatus; label: string }> = [
  { status: "todo", label: "To Do" },
  { status: "in_progress", label: "In Progress" },
  { status: "done", label: "Done" },
];

export const PRIORITIES: CardPriority[] = ["Low", "Medium", "High"];
