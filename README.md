# Ghost AI — Real-Time Collaborative System Design Workspace

A web app where a team designs system architecture diagrams together on a
shared canvas, chats with an AI agent that edits the diagram, and generates a
written spec from the diagram.

## The stack (one line each)

- **Next.js 15 (App Router)** — the whole web app: pages + API routes
- **Clerk** — sign-in/sign-up and sessions
- **Prisma + Postgres (Neon)** — users, projects, snapshots, chat messages
- **@xyflow/react** — the drag-and-drop diagram canvas
- **Liveblocks** — live cursors/presence (optional)
- **Trigger.dev** — runs AI jobs in the background (optional)
- **OpenAI** — turns chat messages into canvas edits (optional)
- **Vercel Blob** — stores snapshot blobs (optional)

Everything marked optional degrades gracefully: no Liveblocks key → no live
cursors; no OpenAI key → a built-in template "AI"; no Trigger → AI runs inline.

## Folder layout

```
frontend/                 The Next.js app (UI + API)
  src/app/                Pages (App Router)
    page.tsx              Landing/redirect
    dashboard/            Project list
    projects/[id]/        The workspace: canvas, chat, snapshots, spec
    share/[id]/           Read-only public view of a project
    sign-in/, sign-up/    Clerk pages
    api/                  JSON API routes (see "API" below)
  src/components/         React components (canvas-board, chat-sidebar, …)
  src/lib/                Shared logic (canvas model, AI agent, db helpers)
  prisma/schema.prisma    Database models
backend/                  Trigger.dev background jobs
  trigger/ai-chat.ts      The one AI job
```

## Database models (prisma/schema.prisma)

- **User** — mirrors a Clerk user (`clerkId`).
- **Project** — a workspace. Owns its `canvasState` (nodes+edges JSON).
- **Collaborator** — many-to-many User↔Project with a `Role`: OWNER / EDITOR / VIEWER.
- **Snapshot** — an immutable saved copy of the canvas + who/when.
- **ChatMessage** — the project's chat history (`role`: user/agent, optional `runId`).

## How the main flows work

### 1. Editing the canvas
`canvas-board.tsx` renders the diagram with React Flow. Every change
(drag, connect, delete) updates local React state, is debounced, and is
`PUT` to `api/projects/[id]/canvas`, which stores it as the project's
`canvasState`. The same JSON is what the AI and the spec generator read.

### 2. Chatting with the AI (the heart of the app)
`POST api/projects/[id]/chat` with `{ message }`:

1. Rate-limit check: max 10 agent replies per project per minute → else 429.
2. Save the user message.
3. `startAgentRun(message, currentCanvas)` in `src/lib/ai-agent.ts`:
   - Trigger.dev configured → start background job `ai-chat`, return `{ runId }`,
     client polls `GET api/projects/[id]/chat/run/[runId]` for progress and the result.
   - Otherwise → run inline: OpenAI if `OPENAI_API_KEY` is set, else the local
     interpreter (`interpretInstruction` in `src/lib/canvas.ts`).
4. The agent returns `{ reply, nodes?, edges?, removeNodeIds?, removeEdgeIds? }`.
5. `applyAgentResult` applies additions/removals to the stored canvas and
   saves the agent's reply as a ChatMessage.
6. The client receives the patch and applies it live via the
   `canvas:patch` window event.

The local interpreter is a regex-based fallback that understands:
`generate a design`, `add a cache`, `remove redis`, `connect API to Postgres`,
`clear`, `explain the current design`. OpenAI is asked for the same JSON shape,
so behavior is identical, just smarter.

### 3. Spec generation & export
`GET api/projects/[id]/spec` runs `generateSpec(canvasState)` (`src/lib/canvas.ts`),
which walks nodes/edges into a markdown document. `spec-view.tsx` shows it with
regenerate/copy/download buttons. PNG/SVG export happens client-side in
`canvas-board.tsx` via `html-to-image`.

### 4. Snapshots & share links
`POST api/projects/[id]/snapshots` copies the current `canvasState` into a
`Snapshot` row (optionally also to Vercel Blob). Restore copies it back.
`POST api/projects/[id]/share` creates a `shareToken`; `/share/[id]` renders
the canvas read-only (autosave disabled).

## Permissions
`src/lib/project-access.ts` is the single gate used by every API route:
user must be Clerk-authenticated, synced into our DB (`sync-user`), and either
the project owner or a collaborator (role decides editor vs viewer).

## Commands

```bash
npm run dev          # frontend dev server (localhost:3000)
npm run dev:backend  # Trigger.dev dev (background AI jobs)
npm test             # vitest unit tests
npm run build        # production build
```

Env vars live in `frontend/.env.local` (Clerk keys, DATABASE_URL, optional
integrations). See `frontend/.env.example` for the full list.
