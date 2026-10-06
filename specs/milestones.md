# Milestones: Real-Time Collaborative System Design Workspace

## Milestone 1: Foundation — Auth, Projects, and Permissions

**Goal:** Users can sign in, create projects, and invite collaborators with role-based permissions.

**Deliverables:**
- Next.js app scaffolded with App Router
- Clerk authentication (sign-in, sign-up, session management)
- Prisma schema and initial migration (User, Project, Collaborator models)
- Project CRUD API routes (create, read, update, delete)
- Collaborator invite flow (email-based, role assignment: owner/editor/viewer)
- Permission enforcement at the API level
- Basic project list page and project detail page

**Depends on:** Nothing

---

## Milestone 2: Real-Time Canvas — Shapes, Edges, and Presence

**Goal:** Collaborators can draw architecture diagrams together on a shared canvas with live cursors and presence.

**Deliverables:**
- Liveblocks integration (room per project)
- Canvas UI with drag-and-drop shapes (databases, services, queues, load balancers, caches)
- Edge creation between shapes (arrows, lines)
- Text labels on shapes and edges
- Move, resize, and delete shapes and edges
- Remote cursor rendering and presence indicators
- Conflict resolution for simultaneous edits (handled by Liveblocks CRDT)
- Pan and zoom canvas navigation
- Keyboard shortcuts (delete, undo, redo, zoom)

**Depends on:** Milestone 1

---

## Milestone 3: Persistence — Auto-Save and Snapshots

**Goal:** Canvas state auto-saves, and users can create, view, and restore snapshots.

**Deliverables:**
- Auto-save canvas state to Postgres (debounced)
- Snapshot model (immutable full-state serialized canvas)
- Manual snapshot trigger (UI button)
- Snapshot history list (view metadata: who, when)
- Restore canvas to a previous snapshot
- Vercel Blob integration for snapshot blob storage

**Depends on:** Milestone 2

---

## Milestone 4: AI Agent — Design Generation and Chat

**Goal:** An AI agent can generate system designs onto the canvas, answer questions in chat, and modify the canvas conversationally.

**Deliverables:**
- Trigger.dev integration for long-running AI jobs
- Chat sidebar UI (message list, input)
- AI job: generate system design from text description, place shapes/edges on canvas
- AI job: answer questions about the current design (canvas state as context)
- AI job: modify canvas based on chat instructions (e.g., "add a Redis cache")
- Progress reporting from Trigger.dev jobs back to the client
- Rate-limiting AI operations per project

**Depends on:** Milestone 2

---

## Milestone 5: Spec Generation and Export

**Goal:** The AI agent can write a detailed markdown spec from the diagram, and users can export the diagram as an image.

**Deliverables:**
- AI job: traverse canvas graph, infer component roles, produce structured markdown spec
- Spec viewer UI (rendered markdown, editable)
- Download/copy spec as markdown file
- Export diagram as PNG/SVG
- Share read-only link to project (view-only mode for stakeholders)

**Depends on:** Milestone 4

---

## Milestone 6: Polish and Hardening

**Goal:** Graceful degradation, performance, and UX polish.

**Deliverables:**
- Graceful degradation when Liveblocks or Trigger.dev is unavailable (read-only banner)
- Performance optimization for 5+ concurrent collaborators
- Error boundaries and loading states
- Responsive layout (desktop-first, but usable on smaller screens)
- E2E test suite (multi-user collaboration, AI generation, spec export)
- Unit and integration test coverage for critical paths

**Depends on:** Milestones 1-5

---

## Suggested Order

```
M1 → M2 → M3
          ↘
            M4 → M5 → M6
```

M3 and M4 can be developed in parallel after M2 is complete.
