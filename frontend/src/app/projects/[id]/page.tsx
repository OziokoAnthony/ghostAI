// The workspace: canvas + presence + chat + snapshots + spec + collaborators.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import CollaboratorManager from "@/components/collaborator-manager";
import CanvasBoard from "@/components/canvas-board";
import ChatSidebar from "@/components/chat-sidebar";
import SpecView from "@/components/spec-view";
import SnapshotPanel from "@/components/snapshot-panel";
import ShareButton from "@/components/share-button";
import PresenceLayer from "@/components/presence";
import type { CanvasState } from "@/lib/canvas";

type Params = { params: Promise<{ id: string }> };

export default async function ProjectPage({ params }: Params) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const project = await prisma.project.findFirst({
    where: {
      id,
      OR: [
        { ownerId: user.id },
        { collaborators: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const isOwner = project.ownerId === user.id;
  const myRole = isOwner
    ? "OWNER"
    : project.collaborators.find((c) => c.userId === user.id)?.role;
  const readOnly = myRole === "VIEWER";

  const missingIntegrations: string[] = [];
  if (!process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY)
    missingIntegrations.push("Liveblocks (presence disabled)");
  if (!process.env.OPENAI_API_KEY)
    missingIntegrations.push("OpenAI (using local template AI)");
  if (!process.env.TRIGGER_SECRET_KEY)
    missingIntegrations.push("Trigger.dev (AI jobs run inline)");
  if (!process.env.BLOB_READ_WRITE_TOKEN)
    missingIntegrations.push("Vercel Blob (snapshots stored inline)");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
        )}
        {missingIntegrations.length > 0 && (
          <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
            <strong>Degraded mode:</strong>{" "}
            {missingIntegrations.join(" · ")}
          </div>
        )}
        <div className="mt-6">
          <PresenceLayer roomId={`project-${project.id}`} name={user.name ?? user.email}>
          <CanvasBoard
            projectId={project.id}
            initialState={
              (project.canvasState as CanvasState | null) ?? {
                nodes: [],
                edges: [],
              }
            }
            readOnly={readOnly}
          />
        </PresenceLayer>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ChatSidebar projectId={project.id} />
          <div className="flex flex-col gap-4">
            <SnapshotPanel projectId={project.id} />
            <ShareButton projectId={project.id} />
          </div>
        </div>
        <div className="mt-6">
          <SpecView projectId={project.id} />
        </div>
        <div className="mt-6">
          <CollaboratorManager
            projectId={project.id}
            collaborators={project.collaborators}
            isOwner={isOwner}
          />
        </div>
      </div>
    </main>
  );
}
