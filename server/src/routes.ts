import { Router, type Request, type Response } from "express";
import {
  createCard,
  deleteCard,
  getCard,
  getStats,
  listCards,
  moveCard,
  updateCard,
  type CardPriority,
  type CardStatus,
} from "./db.js";

const router = Router();

const STATUSES: CardStatus[] = ["todo", "in_progress", "done"];
const PRIORITIES: CardPriority[] = ["Low", "Medium", "High"];

function isStatus(v: unknown): v is CardStatus {
  return typeof v === "string" && (STATUSES as string[]).includes(v);
}

function isPriority(v: unknown): v is CardPriority {
  return typeof v === "string" && (PRIORITIES as string[]).includes(v);
}

function isValidDate(v: unknown): v is string {
  return (
    typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
  );
}

/** Express 5 types route params as string | string[]; our routes use single ids. */
function paramId(req: Request): string {
  return String(req.params.id);
}

router.get("/cards", (req: Request, res: Response) => {
  const search = typeof req.query.search === "string" ? req.query.search : "";
  const priority =
    typeof req.query.priority === "string" ? req.query.priority : "";
  if (priority && !isPriority(priority)) {
    res.status(400).json({ error: "priority must be Low, Medium, or High" });
    return;
  }
  res.json(listCards(search, priority));
});

router.post("/cards", (req: Request, res: Response) => {
  const { title, description, priority, status, dueDate } = req.body ?? {};
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (priority !== undefined && !isPriority(priority)) {
    res.status(400).json({ error: "priority must be Low, Medium, or High" });
    return;
  }
  if (status !== undefined && !isStatus(status)) {
    res.status(400).json({ error: "status must be todo, in_progress, or done" });
    return;
  }
  if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
    res.status(400).json({ error: "dueDate must be YYYY-MM-DD or null" });
    return;
  }
  const card = createCard({ title, description, priority, status, dueDate });
  res.status(201).json(card);
});

router.patch("/cards/:id", (req: Request, res: Response) => {
  const { title, description, priority, status, dueDate } = req.body ?? {};
  if (title !== undefined && (typeof title !== "string" || !title.trim())) {
    res.status(400).json({ error: "title must be a non-empty string" });
    return;
  }
  if (priority !== undefined && !isPriority(priority)) {
    res.status(400).json({ error: "priority must be Low, Medium, or High" });
    return;
  }
  if (status !== undefined && !isStatus(status)) {
    res.status(400).json({ error: "status must be todo, in_progress, or done" });
    return;
  }
  if (dueDate !== undefined && dueDate !== null && !isValidDate(dueDate)) {
    res.status(400).json({ error: "dueDate must be YYYY-MM-DD or null" });
    return;
  }
  const card = updateCard(paramId(req), {
    title,
    description,
    priority,
    status,
    dueDate,
  });
  if (!card) {
    res.status(404).json({ error: "card not found" });
    return;
  }
  res.json(card);
});

router.delete("/cards/:id", (req: Request, res: Response) => {
  if (!deleteCard(paramId(req))) {
    res.status(404).json({ error: "card not found" });
    return;
  }
  res.status(204).send();
});

router.patch("/cards/:id/move", (req: Request, res: Response) => {
  const { status, position } = req.body ?? {};
  if (!isStatus(status)) {
    res.status(400).json({ error: "status must be todo, in_progress, or done" });
    return;
  }
  if (
    position !== undefined &&
    (!Number.isInteger(position) || position < 0)
  ) {
    res.status(400).json({ error: "position must be a non-negative integer" });
    return;
  }
  const card = moveCard(paramId(req), status, position);
  if (!card) {
    res.status(404).json({ error: "card not found" });
    return;
  }
  res.json(card);
});

router.get("/stats", (_req: Request, res: Response) => {
  res.json(getStats());
});

export default router;
