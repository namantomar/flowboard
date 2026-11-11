import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

export interface NewCard {
  title: string;
  description?: string;
  priority?: CardPriority;
  status?: CardStatus;
  dueDate?: string | null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath =
  process.env.DB_PATH ?? path.join(__dirname, "..", "flowboard.db");

export const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS cards (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    due_date TEXT,
    position REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_cards_status_position ON cards (status, position);
`);

function rowToCard(row: Record<string, unknown>): Card {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    priority: row.priority as CardPriority,
    status: row.status as CardStatus,
    dueDate: (row.due_date as string | null) ?? null,
    position: row.position as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

const SEED_CARDS: Array<Omit<Card, "id" | "createdAt" | "updatedAt">> = [
  {
    title: "Design the onboarding flow",
    description:
      "Sketch wireframes for the new user onboarding: welcome screen, workspace setup, and first-board tutorial.",
    priority: "High",
    status: "todo",
    dueDate: "2026-11-20",
    position: 0,
  },
  {
    title: "Set up CI pipeline",
    description:
      "Add GitHub Actions workflow to run typecheck, lint, and tests on every pull request.",
    priority: "Medium",
    status: "todo",
    dueDate: "2026-11-18",
    position: 1,
  },
  {
    title: "Implement drag-and-drop",
    description:
      "Wire up @dnd-kit so cards can be dragged between columns and reordered within a column.",
    priority: "High",
    status: "in_progress",
    dueDate: "2026-11-15",
    position: 0,
  },
  {
    title: "Add card search and filters",
    description:
      "Filter the board by text and priority. Search should match title and description.",
    priority: "Medium",
    status: "in_progress",
    dueDate: "2026-11-22",
    position: 1,
  },
  {
    title: "Write the project README",
    description:
      "Document setup, API endpoints, and project structure so anyone can run the app locally.",
    priority: "Low",
    status: "done",
    dueDate: "2026-11-10",
    position: 0,
  },
  {
    title: "Ship the first release",
    description:
      "Tag v1.0.0, write release notes, and share the demo link with the team.",
    priority: "Medium",
    status: "done",
    dueDate: "2026-11-12",
    position: 1,
  },
];

function seedIfEmpty(): void {
  const count = db
    .prepare("SELECT COUNT(*) AS n FROM cards")
    .get() as { n: number };
  if (count.n > 0) return;

  const now = new Date().toISOString();
  const insert = db.prepare(
    `INSERT INTO cards (id, title, description, priority, status, due_date, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const card of SEED_CARDS) {
    insert.run(
      randomUUID(),
      card.title,
      card.description,
      card.priority,
      card.status,
      card.dueDate,
      card.position,
      now,
      now,
    );
  }
  console.log(`Seeded ${SEED_CARDS.length} sample cards`);
}

seedIfEmpty();

export function listCards(search = "", priority = ""): Card[] {
  const clauses: string[] = [];
  const params: SQLInputValue[] = [];
  if (search.trim()) {
    clauses.push("(title LIKE ? OR description LIKE ?)");
    params.push(`%${search.trim()}%`, `%${search.trim()}%`);
  }
  if (priority) {
    clauses.push("priority = ?");
    params.push(priority);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT * FROM cards ${where} ORDER BY status, position ASC, created_at ASC`,
    )
    .all(...params) as Record<string, unknown>[];
  return rows.map(rowToCard);
}

export function getCard(id: string): Card | null {
  const row = db.prepare("SELECT * FROM cards WHERE id = ?").get(id) as
    | Record<string, unknown>
    | undefined;
  return row ? rowToCard(row) : null;
}

export function createCard(input: NewCard): Card {
  const now = new Date().toISOString();
  const status = input.status ?? "todo";
  const maxPos = db
    .prepare("SELECT COALESCE(MAX(position), -1) AS m FROM cards WHERE status = ?")
    .get(status) as { m: number };
  const card: Card = {
    id: randomUUID(),
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    priority: input.priority ?? "Medium",
    status,
    dueDate: input.dueDate ?? null,
    position: maxPos.m + 1,
    createdAt: now,
    updatedAt: now,
  };
  db.prepare(
    `INSERT INTO cards (id, title, description, priority, status, due_date, position, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    card.id,
    card.title,
    card.description,
    card.priority,
    card.status,
    card.dueDate,
    card.position,
    card.createdAt,
    card.updatedAt,
  );
  return card;
}

export function updateCard(
  id: string,
  patch: Partial<NewCard>,
): Card | null {
  const existing = getCard(id);
  if (!existing) return null;
  const now = new Date().toISOString();
  const next: Card = {
    ...existing,
    title: patch.title !== undefined ? patch.title.trim() : existing.title,
    description:
      patch.description !== undefined
        ? patch.description.trim()
        : existing.description,
    priority: patch.priority ?? existing.priority,
    status: patch.status ?? existing.status,
    dueDate: patch.dueDate !== undefined ? patch.dueDate : existing.dueDate,
    updatedAt: now,
  };
  db.prepare(
    `UPDATE cards SET title = ?, description = ?, priority = ?, status = ?,
     due_date = ?, updated_at = ? WHERE id = ?`,
  ).run(
    next.title,
    next.description,
    next.priority,
    next.status,
    next.dueDate,
    next.updatedAt,
    id,
  );
  return next;
}

export function deleteCard(id: string): boolean {
  const result = db.prepare("DELETE FROM cards WHERE id = ?").run(id);
  return result.changes > 0;
}

/** Move a card to a column, optionally at a given 0-based index within it. */
export function moveCard(
  id: string,
  status: CardStatus,
  position?: number,
): Card | null {
  const card = getCard(id);
  if (!card) return null;

  const siblings = listCards().filter(
    (c) => c.status === status && c.id !== id,
  );
  let targetIndex =
    position === undefined
      ? siblings.length
      : Math.max(0, Math.min(position, siblings.length));

  // Rebuild positions: insert the moved card at targetIndex, renumber 0..n.
  const ordered = [...siblings];
  ordered.splice(targetIndex, 0, { ...card, status });
  const now = new Date().toISOString();
  const update = db.prepare(
    "UPDATE cards SET status = ?, position = ?, updated_at = ? WHERE id = ?",
  );
  ordered.forEach((c, i) => {
    update.run(status, i, now, c.id);
  });

  const moved = getCard(id);
  return moved ?? { ...card, status, position: targetIndex, updatedAt: now };
}

export function getStats(): {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  byPriority: Record<CardPriority, number>;
} {
  const counts = db
    .prepare("SELECT status, COUNT(*) AS n FROM cards GROUP BY status")
    .all() as Array<{ status: CardStatus; n: number }>;
  const byStatus: Record<string, number> = { todo: 0, in_progress: 0, done: 0 };
  for (const row of counts) byStatus[row.status] = row.n;

  const prio = db
    .prepare("SELECT priority, COUNT(*) AS n FROM cards GROUP BY priority")
    .all() as Array<{ priority: CardPriority; n: number }>;
  const byPriority: Record<CardPriority, number> = { Low: 0, Medium: 0, High: 0 };
  for (const row of prio) byPriority[row.priority] = row.n;

  const today = new Date().toISOString().slice(0, 10);
  const overdue = db
    .prepare(
      "SELECT COUNT(*) AS n FROM cards WHERE due_date IS NOT NULL AND due_date < ? AND status != 'done'",
    )
    .get(today) as { n: number };

  return {
    total: byStatus.todo + byStatus.in_progress + byStatus.done,
    todo: byStatus.todo,
    inProgress: byStatus.in_progress,
    done: byStatus.done,
    overdue: overdue.n,
    byPriority,
  };
}
