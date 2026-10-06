import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { CanvasState } from "@/lib/canvas";
import { runAgent } from "@/lib/ai-agent";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const messages = await prisma.chatMessage.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await req.json();
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message)
    return NextResponse.json({ error: "Message required" }, { status: 400 });

  await prisma.chatMessage.create({
    data: { projectId: id, role: "user", content: message },
  });

  const current = (access.project.canvasState as CanvasState | null) ?? {
    nodes: [],
    edges: [],
  };

  // AI agent: OpenAI when configured (behind a Trigger.dev job when that is
  // configured too), otherwise the local deterministic interpreter.
  const result = await runAgent(message, current);

  // Apply canvas mutations and persist (visible to everyone on reload)
  const next: CanvasState = {
    nodes: [...current.nodes, ...(result.nodes ?? [])],
    edges: [...current.edges, ...(result.edges ?? [])],
  };
  await prisma.project.update({
    where: { id },
    data: { canvasState: next as object },
  });

  const saved = await prisma.chatMessage.create({
    data: { projectId: id, role: "agent", content: result.reply },
  });

  return NextResponse.json({
    message: saved,
    patch: { nodes: result.nodes ?? [], edges: result.edges ?? [] },
  });
}
