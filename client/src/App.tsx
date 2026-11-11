import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  createCard,
  deleteCard,
  fetchCards,
  fetchStats,
  moveCard,
  updateCard,
} from "./api";
import type { Card, CardInput, CardStatus, Stats } from "./types";
import { COLUMNS } from "./types";
import Column from "./components/Column";
import CardForm from "./components/CardForm";
import KanbanCard from "./components/KanbanCard";

type FormState =
  | { mode: "create"; status: CardStatus }
  | { mode: "edit"; card: Card }
  | null;

export default function App() {
  const [cards, setCards] = useState<Card[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [form, setForm] = useState<FormState>(null);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const refresh = useCallback(async () => {
    try {
      const [all, s] = await Promise.all([fetchCards(), fetchStats()]);
      setCards(all);
      setStats(s);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load the board.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const visibleCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((c) => {
      if (priorityFilter && c.priority !== priorityFilter) return false;
      if (!q) return true;
      return (
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [cards, search, priorityFilter]);

  const cardsByColumn = useMemo(() => {
    const map: Record<CardStatus, Card[]> = {
      todo: [],
      in_progress: [],
      done: [],
    };
    for (const card of visibleCards) map[card.status].push(card);
    for (const key of Object.keys(map) as CardStatus[]) {
      map[key].sort((a, b) => a.position - b.position);
    }
    return map;
  }, [visibleCards]);

  function findColumnOf(id: string): CardStatus | null {
    const card = cards.find((c) => c.id === id);
    return card ? card.status : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const card = cards.find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeStatus = findColumnOf(activeId);
    if (!activeStatus) return;

    // Dropping over a column or a card in another column moves it there.
    const overStatus =
      (COLUMNS.find((c) => c.status === overId)?.status as CardStatus | undefined) ??
      findColumnOf(overId);
    if (!overStatus || overStatus === activeStatus) return;

    setCards((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, status: overStatus } : c)),
    );
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCard(null);
    if (!over) {
      refresh();
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCard = cards.find((c) => c.id === activeId);
    if (!activeCard) return;

    const overStatus =
      (COLUMNS.find((c) => c.status === overId)?.status as CardStatus | undefined) ??
      findColumnOf(overId) ??
      activeCard.status;

    // Position within the target column, based on the card it was dropped on.
    const columnCards = cardsByColumn[overStatus].filter((c) => c.id !== activeId);
    let newIndex = columnCards.length;
    const overIndex = columnCards.findIndex((c) => c.id === overId);
    if (overIndex >= 0) newIndex = overIndex;

    // Optimistic local reorder.
    setCards((prev) => {
      const without = prev.filter((c) => c.id !== activeId);
      const moved = { ...activeCard, status: overStatus };
      const inColumn = without
        .filter((c) => c.status === overStatus)
        .sort((a, b) => a.position - b.position);
      inColumn.splice(newIndex, 0, moved);
      const rest = without.filter((c) => c.status !== overStatus);
      return [...rest, ...inColumn.map((c, i) => ({ ...c, position: i }))];
    });

    try {
      const updated = await moveCard(activeId, overStatus, newIndex);
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      const s = await fetchStats();
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to move the card.");
      refresh();
    }
  }

  async function handleFormSubmit(input: CardInput) {
    try {
      if (form?.mode === "edit") {
        const updated = await updateCard(form.card.id, input);
        setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCard(input);
        setCards((prev) => [...prev, created]);
      }
      setForm(null);
      const s = await fetchStats();
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the card.");
    }
  }

  async function handleDelete(card: Card) {
    if (!window.confirm(`Delete "${card.title}"?`)) return;
    try {
      await deleteCard(card.id);
      setCards((prev) => prev.filter((c) => c.id !== card.id));
      const s = await fetchStats();
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete the card.");
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <div>
          <h1>Flowboard</h1>
          <p className="subtitle">
            A lightweight Kanban board — drag cards between columns, filter, and
            keep track of what’s next.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setForm({ mode: "create", status: "todo" })}
        >
          + New card
        </button>
      </header>

      {stats && (
        <div className="stats">
          <span>
            <strong>{stats.total}</strong> cards
          </span>
          <span>
            <strong>{stats.todo}</strong> to do
          </span>
          <span>
            <strong>{stats.inProgress}</strong> in progress
          </span>
          <span>
            <strong>{stats.done}</strong> done
          </span>
          <span>
            <strong>{stats.byPriority.High}</strong> high priority
          </span>
          {stats.overdue > 0 && (
            <span className="stat-overdue">
              <strong>{stats.overdue}</strong> overdue
            </span>
          )}
        </div>
      )}

      <div className="toolbar">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search cards…"
          aria-label="Search cards"
        />
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          aria-label="Filter by priority"
        >
          <option value="">All priorities</option>
          <option value="High">High priority</option>
          <option value="Medium">Medium priority</option>
          <option value="Low">Low priority</option>
        </select>
      </div>

      {error && (
        <p className="error-banner" role="alert">
          {error}{" "}
          <button type="button" className="btn btn-small" onClick={refresh}>
            Retry
          </button>
        </p>
      )}

      {loading ? (
        <p className="loading">Loading your board…</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <main className="board">
            {COLUMNS.map((col) => (
              <Column
                key={col.status}
                status={col.status}
                label={col.label}
                cards={cardsByColumn[col.status]}
                onAdd={(status) => setForm({ mode: "create", status })}
                onEdit={(card) => setForm({ mode: "edit", card })}
                onDelete={handleDelete}
              />
            ))}
          </main>
          <DragOverlay>
            {activeCard ? (
              <KanbanCard
                card={activeCard}
                onEdit={() => undefined}
                onDelete={() => undefined}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      {form && (
        <CardForm
          initial={form.mode === "edit" ? form.card : null}
          defaultStatus={form.mode === "create" ? form.status : "todo"}
          onSubmit={handleFormSubmit}
          onClose={() => setForm(null)}
        />
      )}

      <footer className="app-footer">
        Flowboard — React, TypeScript, Express &amp; SQLite.
      </footer>
    </div>
  );
}
