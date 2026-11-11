import { useState } from "react";
import type { Card, CardInput, CardPriority, CardStatus } from "../types";
import { PRIORITIES } from "../types";

interface Props {
  initial?: Card | null;
  defaultStatus: CardStatus;
  onSubmit: (input: CardInput) => void;
  onClose: () => void;
}

export default function CardForm({ initial, defaultStatus, onSubmit, onClose }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priority, setPriority] = useState<CardPriority>(initial?.priority ?? "Medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("A title is required.");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      priority,
      status: initial?.status ?? defaultStatus,
      dueDate: dueDate || null,
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>{initial ? "Edit card" : "New card"}</h2>

        <label>
          Title *
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs doing?"
            maxLength={120}
          />
        </label>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add details, context, or links…"
            rows={4}
            maxLength={1000}
          />
        </label>

        <div className="form-row">
          <label>
            Priority
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as CardPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {initial ? "Save changes" : "Add card"}
          </button>
        </div>
      </form>
    </div>
  );
}
