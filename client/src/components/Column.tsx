import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Card, CardStatus } from "../types";
import KanbanCard from "./KanbanCard";

interface Props {
  status: CardStatus;
  label: string;
  cards: Card[];
  onAdd: (status: CardStatus) => void;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

const ACCENTS: Record<CardStatus, string> = {
  todo: "accent-todo",
  in_progress: "accent-progress",
  done: "accent-done",
};

export default function Column({
  status,
  label,
  cards,
  onAdd,
  onEdit,
  onDelete,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <section className={`column ${ACCENTS[status]} ${isOver ? "column-over" : ""}`}>
      <header className="column-header">
        <h2>
          {label}
          <span className="count">{cards.length}</span>
        </h2>
        <button
          type="button"
          className="btn btn-small btn-ghost"
          onClick={() => onAdd(status)}
          aria-label={`Add card to ${label}`}
        >
          + Add
        </button>
      </header>

      <div ref={setNodeRef} className="column-body">
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <p className="empty">No cards here yet — drag one in or add a new card.</p>
        )}
      </div>
    </section>
  );
}
