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

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        {project.description && (
          <p className="mt-2 text-gray-600">{project.description}</p>
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
