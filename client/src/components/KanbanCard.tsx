import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Card } from "../types";

interface Props {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (card: Card) => void;
}

function isOverdue(card: Card): boolean {
  if (!card.dueDate || card.status === "done") return false;
  return card.dueDate < new Date().toISOString().slice(0, 10);
}

function formatDue(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function KanbanCard({ card, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`card ${isDragging ? "card-dragging" : ""}`}
      {...attributes}
      {...listeners}
    >
      <div className="card-top">
        <span className={`priority priority-${card.priority.toLowerCase()}`}>
          {card.priority}
        </span>
        {card.dueDate && (
          <span className={`due ${isOverdue(card) ? "due-overdue" : ""}`}>
            {isOverdue(card) ? "Overdue · " : ""}
            {formatDue(card.dueDate)}
          </span>
        )}
      </div>

      <h3 className="card-title">{card.title}</h3>
      {card.description && <p className="card-desc">{card.description}</p>}

      <div className="card-actions">
        <button
          type="button"
          className="btn btn-small"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onEdit(card)}
        >
          Edit
        </button>
        <button
          type="button"
          className="btn btn-small btn-danger"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(card)}
        >
          Delete
        </button>
      </div>
    </article>
  );
}
