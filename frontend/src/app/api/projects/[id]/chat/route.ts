import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { CanvasState } from "@/lib/canvas";
import { runAgent, startAgentRun } from "@/lib/ai-agent";
import { applyAgentResult } from "@/lib/apply-agent-result";

type Params = { params: Promise<{ id: string }> };

const AI_LIMIT_PER_MINUTE = 10;

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

  // Rate limit AI operations per project
  const since = new Date(Date.now() - 60_000);
  const recent = await prisma.chatMessage.count({
    where: { projectId: id, role: "agent", createdAt: { gte: since } },
  });
  if (recent >= AI_LIMIT_PER_MINUTE) {
    return NextResponse.json(
      { error: "AI rate limit reached — try again in a minute." },
      { status: 429 }
    );
  }

  const current = (access.project.canvasState as CanvasState | null) ?? {
    nodes: [],
    edges: [],
  };

  const started = await startAgentRun(message, current);

  // Trigger.dev path: async — client polls /chat/run/[runId]
  if ("runId" in started) {
    await prisma.chatMessage.create({
      data: { projectId: id, role: "user", content: message, runId: started.runId },
    });
    return NextResponse.json({ pending: true, runId: started.runId });
  }

  await prisma.chatMessage.create({
    data: { projectId: id, role: "user", content: message },
  });

  const applied = await applyAgentResult(id, current, started.result);
  return NextResponse.json(applied);
}
