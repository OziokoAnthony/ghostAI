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
          `Respond with JSON only: {"reply": string, "add": [{"kind": one of ${KINDS.join("|")}, "label": string, "connectFromLabel"?: string}]}`,
      },
      { role: "user", content: message },
    ],
  });

  const text = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(text) as {
    reply?: string;
    add?: { kind: ShapeKind; label: string; connectFromLabel?: string }[];
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

  return {
    reply: parsed.reply ?? "Done.",
    nodes: nodes.length ? nodes : undefined,
    edges: edges.length ? edges : undefined,
  };
}

/** Local fallback agent — no keys required. */
function runLocal(message: string, current: CanvasState): AgentResult {
  return interpretInstruction(message, current);
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
