// Applies an AgentResult (add/remove nodes/edges) to the stored canvas and saves the agent reply.

import { prisma } from "@/lib/prisma";
import type { CanvasState } from "@/lib/canvas";
import type { runAgent } from "@/lib/ai-agent";

export async function applyAgentResult(
  projectId: string,
  current: CanvasState,
  result: Awaited<ReturnType<typeof runAgent>>,
  runId?: string
) {
  const removedNodes = new Set(result.removeNodeIds ?? []);
  const removedEdges = new Set(result.removeEdgeIds ?? []);
  const keptNodes = current.nodes.filter((n) => !removedNodes.has(n.id));
  const keptEdges = current.edges.filter(
    (e) =>
      !removedEdges.has(e.id) &&
      !removedNodes.has(e.source) &&
      !removedNodes.has(e.target)
  );
  const next: CanvasState = {
    nodes: [...keptNodes, ...(result.nodes ?? [])],
    edges: [...keptEdges, ...(result.edges ?? [])],
  };
  await prisma.project.update({
    where: { id: projectId },
    data: { canvasState: next as object },
  });

  const saved = await prisma.chatMessage.create({
    data: {
      projectId,
      role: "agent",
      content: result.reply,
      runId: runId ?? null,
    },
  });

  return {
    message: saved,
    patch: {
      nodes: result.nodes ?? [],
      edges: result.edges ?? [],
      removeNodeIds: result.removeNodeIds ?? [],
      removeEdgeIds: result.removeEdgeIds ?? [],
    },
    state: next,
  };
}
