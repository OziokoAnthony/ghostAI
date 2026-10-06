# Codebase Map

One line per file — read this first, then open files in the order below.

## Reading order

1. `frontend/prisma/schema.prisma` — the 5 models, start here for the data shape.
2. `frontend/src/lib/canvas.ts` — the canvas data model + local AI fallback + spec generator.
3. `frontend/src/lib/ai-agent.ts` — how chat messages become canvas edits.
4. `frontend/src/lib/project-access.ts` — the permission gate every API route uses.
5. `frontend/src/app/projects/[id]/page.tsx` — the workspace page; see how the components compose.
6. `frontend/src/components/canvas-board.tsx` — the interactive canvas.
7. `frontend/src/components/chat-sidebar.tsx` — chat UI ↔ AI agent.
8. `backend/trigger/ai-chat.ts` — the background AI job.

## Every file

### backend/
- `backend/trigger/ai-chat.ts` — Trigger.dev job: runs the AI agent, publishes progress, falls back locally.
- `backend/trigger.config.ts` — Trigger.dev CLI config.

### frontend/src/app/ (pages)
- `page.tsx` — landing; redirects based on auth.
- `layout.tsx` — root layout (ClerkProvider).
- `error.tsx` — app-wide error boundary.
- `dashboard/page.tsx` + `dashboard/layout.tsx` — project list.
- `projects/[id]/page.tsx` — the workspace (canvas, chat, snapshots, spec, collaborators).
- `projects/[id]/layout.tsx`, `loading.tsx` — shell + skeleton.
- `share/[id]/page.tsx` — public read-only project view.
- `sign-in/[[...sign-in]]/page.tsx`, `sign-up/[[...sign-up]]/page.tsx` — Clerk pages.

### frontend/src/app/api/ (JSON API)
- `projects/route.ts` — GET list / POST create.
- `projects/[id]/route.ts` — GET one / PATCH / DELETE.
- `projects/[id]/canvas/route.ts` — PUT canvas autosave.
- `projects/[id]/chat/route.ts` — GET history / POST message (AI + rate limit).
- `projects/[id]/chat/run/[runId]/route.ts` — poll Trigger.dev run; apply result.
- `projects/[id]/collaborators/route.ts`, `collaborators/[collabId]/route.ts` — manage roles.
- `projects/[id]/share/route.ts` — create/revoke share link.
- `projects/[id]/snapshots/route.ts`, `snapshots/[snapshotId]/restore/route.ts` — snapshot CRUD/restore.
- `projects/[id]/spec/route.ts` — GET generated markdown spec.
- `sync-user/route.ts` — Clerk user → our User row.

### frontend/src/components/ (UI)
- `canvas-board.tsx` — React Flow canvas: shapes, edges, undo/redo, autosave, PNG/SVG export.
- `chat-sidebar.tsx` — chat UI, polls AI runs, dispatches canvas patches.
- `presence.tsx` — Liveblocks live cursors (no-op when unconfigured).
- `collaborator-manager.tsx` — invite/role/remove UI.
- `create-project-button.tsx` — new project dialog.
- `header.tsx` — top nav.
- `project-list.tsx` — project cards.
- `share-button.tsx` — share link UI.
- `snapshot-panel.tsx` — snapshot list/create/restore.
- `spec-view.tsx` — spec display + copy/download.

### frontend/src/lib/ (shared logic)
- `canvas.ts` — types + template AI interpreter + spec generator (pure functions, unit-tested).
- `ai-agent.ts` — Trigger.dev / OpenAI / local fallback selection.
- `apply-agent-result.ts` — apply AI edits to stored canvas + save reply.
- `project-access.ts` — auth/role check used by API routes.
- `sync-user.ts` — upsert Clerk user into Prisma.
- `prisma.ts` — singleton Prisma client.
- `__tests__/canvas.test.ts` — vitest tests for canvas logic.

### Config & schema
- `frontend/src/middleware.ts` — Clerk route protection.
- `frontend/prisma/schema.prisma` — DB models.
- `frontend/.env.example` — every env var explained.
