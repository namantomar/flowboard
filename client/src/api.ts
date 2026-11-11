import type { Card, CardInput, CardStatus, Stats } from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export function fetchCards(search = "", priority = ""): Promise<Card[]> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (priority) params.set("priority", priority);
  const query = params.toString();
  return request<Card[]>(`/cards${query ? `?${query}` : ""}`);
}

export function fetchStats(): Promise<Stats> {
  return request<Stats>("/stats");
}

export function createCard(input: CardInput): Promise<Card> {
  return request<Card>("/cards", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateCard(
  id: string,
  patch: Partial<CardInput>,
): Promise<Card> {
  return request<Card>(`/cards/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export function deleteCard(id: string): Promise<void> {
  return request<void>(`/cards/${id}`, { method: "DELETE" });
}

export function moveCard(
  id: string,
  status: CardStatus,
  position: number,
): Promise<Card> {
  return request<Card>(`/cards/${id}/move`, {
    method: "PATCH",
    body: JSON.stringify({ status, position }),
  });
}
