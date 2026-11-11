# Flowboard

A full-stack Kanban board for organizing work. Create cards, drag them between
columns, set priorities and due dates, and filter the board — with everything
persisted to a SQLite database through a REST API.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![SQLite](https://img.shields.io/badge/SQLite-003B57?logo=sqlite)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Features

- Three columns — **To Do**, **In Progress**, **Done** — with drag-and-drop
  between columns and reordering within a column (`@dnd-kit`)
- Create, edit, and delete cards with title, description, priority
  (Low / Medium / High), and due date
- Search cards by text and filter by priority
- Overdue cards are highlighted; a stats bar shows counts by column,
  high-priority cards, and overdue cards
- REST API backed by SQLite (Node 24's built-in `node:sqlite`, no native
  modules), seeded with 6 sample cards on first run

## Tech stack

| Layer    | Technology                                             |
| -------- | ------------------------------------------------------ |
| Frontend | React 19, TypeScript, Vite, @dnd-kit                  |
| Backend  | Node.js 24, Express 5, TypeScript                      |
| Storage  | SQLite via Node's built-in `node:sqlite`               |
| Tooling  | npm workspaces, concurrently, tsx (dev), tsc (build)   |

## How to run

Requires **Node.js 24+** and npm.

```bash
# Install everything (root + client + server workspaces)
npm run install:all

# Start both the API (http://localhost:4000) and the client (http://localhost:5173)
npm run dev
```

Or run each part separately:

```bash
npm run server:dev   # API only, with live reload (tsx watch)
npm run client:dev   # Vite dev server only
```

The client proxies `/api` requests to the server in development, so the app
works with a single origin. The database file `server/flowboard.db` is created
automatically on first run and seeded with 6 sample cards.

### Production build

```bash
npm run build        # builds the client and the server
npm run start        # runs the compiled API from server/dist
```

## API endpoints

Base URL: `http://localhost:4000/api`

| Method | Endpoint              | Description                              |
| ------ | --------------------- | ---------------------------------------- |
| GET    | `/health`             | Service health check                     |
| GET    | `/cards`              | List cards (`?search=` and `?priority=` filters) |
| POST   | `/cards`              | Create a card                            |
| PATCH  | `/cards/:id`          | Update a card's fields                   |
| DELETE | `/cards/:id`          | Delete a card                            |
| PATCH  | `/cards/:id/move`     | Move a card to a column / position       |
| GET    | `/stats`              | Board counts (by column, priority, overdue) |

Card shape:

```json
{
  "id": "uuid",
  "title": "Design the onboarding flow",
  "description": "Sketch wireframes…",
  "priority": "High",
  "status": "todo",
  "dueDate": "2026-11-20",
  "position": 0,
  "createdAt": "2026-11-10T12:00:00.000Z",
  "updatedAt": "2026-11-10T12:00:00.000Z"
}
```

## Project structure

```
flowboard/
├── client/                  # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── api.ts           # Typed fetch wrappers for the REST API
│   │   ├── types.ts         # Card, Stats, and column types
│   │   ├── App.tsx          # Board state, drag-and-drop, filters
│   │   ├── components/
│   │   │   ├── Column.tsx   # One Kanban column (droppable)
│   │   │   ├── KanbanCard.tsx # Sortable card
│   │   │   └── CardForm.tsx # Create / edit modal
│   │   └── index.css        # Board styling
│   └── vite.config.ts       # Dev proxy: /api → localhost:4000
├── server/                  # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts         # App bootstrap, /api/health
│   │   ├── db.ts            # SQLite schema, seeding, queries
│   │   └── routes.ts        # REST routes + validation
│   └── flowboard.db         # Created on first run (gitignored)
├── package.json             # npm workspaces + dev/build scripts
├── LICENSE                  # MIT
└── README.md
```

## License

MIT — see [LICENSE](LICENSE).
