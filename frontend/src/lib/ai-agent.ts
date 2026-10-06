import {
  interpretInstruction,
  createNode,
  nextId,
  type AgentResult,
  type CanvasState,
  type ShapeKind,
} from "@/lib/canvas";

const KINDS: ShapeKind[] = [
  "service",
  "database",
  "queue",
  "loadbalancer",
  "cache",
  "client",
];

/** Call OpenAI to turn a chat message into canvas mutations. */
export async function runWithOpenAI(
  message: string,
  current: CanvasState
): Promise<AgentResult> {
  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI();

  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `You are a system design assistant for a collaborative canvas. ` +
          `Current canvas JSON: ${JSON.stringify(current)}. ` +
          `Respond with JSON only: {"reply": string, "add": [{"kind": one of ${KINDS.join("|")}, "label": string, "connectFromLabel"?: string}], "remove": [string label substrings to delete], "connect": [{"from": string label substring, "to": string label substring}]}`,
      },
      { role: "user", content: message },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as {
    reply?: string;
    add?: { kind: ShapeKind; label: string; connectFromLabel?: string }[];
    remove?: string[];
    connect?: { from: string; to: string }[];
  };

  const nodes: ReturnType<typeof createNode>[] = [];
  const edges: NonNullable<AgentResult["edges"]> = [];
  for (const [i, item] of (parsed.add ?? []).entries()) {
    const node = createNode(
      KINDS.includes(item.kind) ? item.kind : "service",
      item.label ?? "Component",
      { x: 200 + i * 160, y: 200 + i * 60 }
    );
    nodes.push(node);
    const from =
      item.connectFromLabel &&
      current.nodes.find((n) => n.data.label === item.connectFromLabel);
    if (from)
      edges.push({ id: nextId("e"), source: from.id, target: node.id });
  }

  const removeNodeIds: string[] = [];
  const removeEdgeIds: string[] = [];
  for (const rm of parsed.remove ?? []) {
    const node = current.nodes.find((n) =>
      n.data.label.toLowerCase().includes(String(rm).toLowerCase())
    );
    if (!node) continue;
    removeNodeIds.push(node.id);
    for (const e of current.edges) {
      if (e.source === node.id || e.target === node.id)
        removeEdgeIds.push(e.id);
    }
  }
  for (const c of parsed.connect ?? []) {
    const from = current.nodes.find((n) =>
      n.data.label.toLowerCase().includes(String(c.from).toLowerCase())
    );
    const to = current.nodes.find((n) =>
      n.data.label.toLowerCase().includes(String(c.to).toLowerCase())
    );
    if (from && to)
      edges.push({ id: nextId("e"), source: from.id, target: to.id });
  }

  return {
    reply: parsed.reply ?? "Done.",
    nodes: nodes.length ? nodes : undefined,
    edges: edges.length ? edges : undefined,
    removeNodeIds: removeNodeIds.length ? removeNodeIds : undefined,
    removeEdgeIds: removeEdgeIds.length ? removeEdgeIds : undefined,
  };
}

/** Local fallback agent — no keys required. */
function runLocal(message: string, current: CanvasState): AgentResult {
  return interpretInstruction(message, current);
}

/**
 * Kick off an AI agent run. When Trigger.dev is configured the job runs
 * asynchronously (client should poll getAgentRunStatus); otherwise we run
 * OpenAI (or the local fallback) inline and return the result immediately.
 */
export async function startAgentRun(
  message: string,
  current: CanvasState
): Promise<{ runId: string } | { result: AgentResult }> {
  if (process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_PROJECT_REF) {
    try {
      const { tasks } = await import("@trigger.dev/sdk/v3");
      const handle = await tasks.trigger("ai-chat", { message, current });
      return { runId: handle.id };
    } catch {
      // fall through to inline execution
    }
  }
  return { result: await runAgent(message, current) };
}

export interface AgentRunStatus {
  status: string;
  progress?: string;
  output?: AgentResult;
  error?: string;
}

export async function getAgentRunStatus(
  runId: string
): Promise<AgentRunStatus> {
  const { runs } = await import("@trigger.dev/sdk/v3");
  const run = await runs.retrieve(runId);
  const meta = (run as unknown as { metadata?: { progress?: string } })
    .metadata;
  return {
    status: run.status,
    progress: meta?.progress,
    output:
      run.status === "COMPLETED"
        ? (run.output as AgentResult | undefined)
        : undefined,
    error:
      run.status === "FAILED" || run.status === "CANCELED"
        ? "AI job did not complete"
        : undefined,
  };
}

export async function runAgent(
  message: string,
  current: CanvasState
): Promise<AgentResult> {
  if (!process.env.OPENAI_API_KEY) {
    return runLocal(message, current);
  }

  // Trigger.dev: if configured, dispatch the AI job through it
  if (process.env.TRIGGER_SECRET_KEY) {
    try {
      const { tasks, runs } = await import("@trigger.dev/sdk/v3");
      const handle = await tasks.trigger("ai-chat", { message, current });
      const run = await runs.poll(handle.id, { pollIntervalMs: 1000 });
      if (run.output) return run.output as AgentResult;
    } catch {
      // fall through to direct execution
    }
  }

  try {
    return await runWithOpenAI(message, current);
  } catch {
    // Graceful degradation: never lose the user's message
    return runLocal(message, current);
  }
}
