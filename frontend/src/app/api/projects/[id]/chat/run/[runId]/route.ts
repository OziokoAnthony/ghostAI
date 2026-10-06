import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import type { CanvasState } from "@/lib/canvas";
import { getAgentRunStatus } from "@/lib/ai-agent";
import { applyAgentResult } from "@/lib/apply-agent-result";

type Params = { params: Promise<{ id: string; runId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id, runId } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  try {
    const status = await getAgentRunStatus(runId);

    // When finished, persist the result once and apply it to the canvas.
    if (status.status === "COMPLETED" && status.output) {
      const existing = await prisma.chatMessage.findFirst({
        where: { projectId: id, runId, role: "agent" },
      });
      if (!existing) {
        const current = (access.project.canvasState as CanvasState | null) ?? {
          nodes: [],
          edges: [],
        };
        const applied = await applyAgentResult(id, current, status.output, runId);
        return NextResponse.json({ ...status, ...applied });
      }
      return NextResponse.json({ ...status });
    }

    return NextResponse.json(status);
  } catch (err) {
    return NextResponse.json(
      { error: "Could not retrieve run status" },
      { status: 502 }
    );
  }
}
