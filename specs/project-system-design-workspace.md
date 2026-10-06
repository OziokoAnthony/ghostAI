# Spec: Real-Time Collaborative System Design Workspace

## Problem Statement

System design is a team sport, but the tools don't reflect that. Engineers juggle between static diagram tools (draw.io, Excalidraw), chat threads, and spec documents that drift out of date. There is no shared, living canvas where a team can design together in real time and then turn that design into an implementable spec without copy-pasting between tools.

## Solution

A multiplayer whiteboard for system design. Several people draw architecture diagrams together on a shared canvas — dragging shapes (databases, services, queues), connecting them with edges, and seeing each other's cursors and presence. An AI agent participates too: it can generate a system design onto the canvas, answer questions in a chat sidebar, and once the design is done, write a detailed markdown spec from the diagram that a dev team could implement.

## User Stories

1. As a user, I want to sign in with my account, so that my projects and collaborators are tied to my identity.
2. As a user, I want to create a new project, so that I have a dedicated canvas for a system design effort.
3. As a project owner, I want to invite collaborators by email, so that they can join my design session.
4. As a project owner, I want to set permissions (viewer, editor) per collaborator, so that I control who can modify the canvas.
5. As a collaborator, I want to see who else is currently viewing or editing the project, so that I know who is present.
6. As a collaborator, I want to see other users' cursors moving on the canvas in real time, so that I can follow their attention and avoid conflicts.
7. As a collaborator, I want to drag and drop shapes (databases, services, queues, load balancers, caches) onto the canvas, so that I can express the system's architecture visually.
8. As a collaborator, I want to connect shapes with edges (arrows, lines), so that I can show data flow and dependencies between components.
9. As a collaborator, I want to move, resize, and delete shapes and edges, so that I can iterate on the design.
10. As a collaborator, I want to add text labels to shapes and edges, so that I can annotate the diagram with names, protocols, or notes.
11. As a user, I want the canvas to auto-save my changes, so that I never lose work.
12. As a user, I want to see a history of snapshots of the canvas, so that I can review or restore earlier versions.
13. As a user, I want to manually trigger a snapshot, so that I can mark a known-good state before making risky changes.
14. As a user, I want to restore the canvas to a previous snapshot, so that I can undo a bad design direction.
15. As a user, I want to share a read-only link to the project, so that stakeholders can view the design without editing.
16. As a user, I want to export the diagram as an image (PNG/SVG), so that I can embed it in docs or slides.
17. As a user, I want to open a chat sidebar, so that I can communicate with collaborators and the AI agent without leaving the canvas.
18. As a user, I want to ask the AI agent to generate a system design from a text description, so that I can get a starting point quickly.
19. As a user, I want the AI agent to place generated shapes and edges onto the shared canvas, so that the whole team can see and react to it.
20. As a user, I want to ask the AI agent questions about the current design in the chat, so that I can get explanations or suggestions.
21. As a user, I want the AI agent to modify the canvas based on my chat instructions (e.g., "add a Redis cache between the API and the database"), so that I can iterate conversationally.
22. As a user, I want the AI agent to write a detailed markdown spec from the current diagram, so that a dev team can implement it.
23. As a user, I want the generated spec to include component descriptions, data flow, interfaces, and technology choices, so that it is actionable.
24. As a user, I want to download or copy the generated spec, so that I can share it outside the app.
25. As a user, I want the AI's long-running tasks (generation, spec writing) to show progress in the UI, so that I know the system is working.
26. As a user, I want the app to work smoothly with 5+ concurrent collaborators on one canvas, so that the whole team can design together.
27. As a user, I want conflict resolution when two people edit the same shape simultaneously, so that changes are not silently lost.
28. As a project owner, I want to delete a project, so that I can clean up old or abandoned designs.
29. As a user, I want keyboard shortcuts for common actions (delete, undo, redo, zoom), so that I can work efficiently.
30. As a user, I want to pan and zoom the canvas, so that I can navigate large diagrams.

## Implementation Decisions

- **Framework**: Next.js (App Router) for the full-stack React application.
- **Real-time collaboration**: Liveblocks for presence, cursors, and shared canvas state (CRDT-based, handles conflict resolution).
- **Long-running AI tasks**: Trigger.dev for background job orchestration (AI generation, spec writing) with progress reporting back to the client.
- **Authentication**: Clerk for user management, sign-in/sign-up, and session management.
- **Database**: Prisma with Postgres for persistent data (projects, collaborators, permissions, snapshots, chat messages).
- **File storage**: Vercel Blob for snapshot storage (serialized canvas state as JSON, plus optional PNG renders).
- **AI integration**: The AI agent receives the current canvas state (shapes, edges, labels) as context and can emit structured commands to mutate the canvas or write to the chat.
- **Canvas rendering**: A React-based canvas (e.g., React Flow or custom) that renders shapes, edges, labels, and remote cursors.
- **Spec generation**: The AI agent traverses the graph of shapes and edges, infers component roles from shape types, and produces a structured markdown document.
- **Permissions model**: Role-based (owner, editor, viewer) enforced at the API level and reflected in the UI (viewers see a read-only canvas).
- **Snapshot model**: Each snapshot is a full serialized canvas state stored as a blob; snapshots are immutable once created.
- **Chat**: Messages stored in Postgres; AI responses streamed or polled from Trigger.dev job results.

## Testing Decisions

- **Unit tests**: Pure functions for canvas state transformations (add/remove/move shapes, connect edges), permission checks, and spec-generation logic.
- **Integration tests**: API routes for project CRUD, collaborator invites, snapshot save/restore, and chat message persistence.
- **Component tests**: Canvas interactions (drag, drop, connect, delete) using React Testing Library.
- **E2E tests**: Multi-user collaboration flows (two browser contexts editing the same canvas), AI generation flow, and spec export.
- **What makes a good test**: Test external behavior (what the user sees and can do), not implementation details. For the canvas, assert on the rendered shapes and edges, not internal state shape.
- **Prior art**: If the repo has existing tests, follow their patterns. If greenfield, establish a testing convention early (Vitest for unit/integration, Playwright for E2E).

## Out of Scope

- Real-time voice or video chat
- Offline mode / local-first sync
- Version control with branching and merging (snapshots are linear)
- Custom shape libraries beyond the built-in set
- Exporting to draw.io or other diagram tool formats
- Mobile-optimized canvas editing (desktop-first)
- Billing and usage metering
- Comments or annotations pinned to specific canvas elements
- Integration with Jira, Linear, or other project management tools

## Further Notes

- The AI agent's canvas mutations should be visible to all collaborators in real time, just like human edits.
- The generated spec should be editable by the user after generation (it is a starting point, not a final document).
- Consider rate-limiting AI operations per project to control costs.
- The canvas should degrade gracefully if Liveblocks or Trigger.dev is unavailable (read-only mode with a banner).
