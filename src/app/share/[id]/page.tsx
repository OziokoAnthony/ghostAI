import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CanvasBoard from "@/components/canvas-board";
import type { CanvasState } from "@/lib/canvas";

export default async function SharePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || !project.shareToken || project.shareToken !== token) {
    notFound();
  }

  const state = (project.canvasState as CanvasState | null) ?? {
    nodes: [],
    edges: [],
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="mb-4 text-xl font-bold">{project.name} (read-only)</h1>
      <CanvasBoard
        projectId={project.id}
        initialState={state}
        readOnly
        disableSave
      />
    </main>
  );
}
