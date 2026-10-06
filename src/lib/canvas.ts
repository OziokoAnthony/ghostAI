// Pure canvas-state helpers shared by the canvas UI, chat agent, and spec generator.

export type ShapeKind =
  | "service"
  | "database"
  | "queue"
  | "loadbalancer"
  | "cache"
  | "client";

export interface CanvasNodeData {
  label: string;
  kind: ShapeKind;
  [key: string]: unknown;
}

export interface CanvasNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: CanvasNodeData;
  [key: string]: unknown;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  [key: string]: unknown;
}

export interface CanvasState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const emptyCanvas: CanvasState = { nodes: [], edges: [] };

let counter = 0;
export function nextId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function createNode(
  kind: ShapeKind,
  label: string,
  position: { x: number; y: number }
): CanvasNode {
  return {
    id: nextId(kind),
    type: "shape",
    position,
    data: { label, kind },
  };
}

// --- Chat command interpreter (template AI; OpenAI can replace this) ---

export interface AgentResult {
  reply: string;
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
}

const ADD_RE =
  /add (?:a |an )?(service|database|db|queue|load ?balancer|loadbalancer|cache|client|redis|postgres|mysql)(?: (?:between|called|named) (.+))?/i;

function kindFromWord(word: string): ShapeKind {
  const w = word.toLowerCase().replace(/\s/g, "");
  if (w === "db" || w === "database" || w === "postgres" || w === "mysql")
    return "database";
  if (w === "queue") return "queue";
  if (w === "loadbalancer") return "loadbalancer";
  if (w === "cache" || w === "redis") return "cache";
  if (w === "client") return "client";
  return "service";
}

/** Turn a chat instruction into canvas mutations. Deterministic fallback for the AI agent. */
export function interpretInstruction(
  message: string,
  current: CanvasState
): AgentResult {
  const lower = message.toLowerCase();

  if (lower.includes("generate") || lower.includes("design a")) {
    const nodes = [
      createNode("client", "Client", { x: 0, y: 120 }),
      createNode("loadbalancer", "Load Balancer", { x: 220, y: 120 }),
      createNode("service", "API Service", { x: 460, y: 120 }),
      createNode("cache", "Redis Cache", { x: 700, y: 0 }),
      createNode("database", "Postgres", { x: 700, y: 240 }),
      createNode("queue", "Job Queue", { x: 460, y: 300 }),
    ];
    const edges: CanvasEdge[] = [
      { id: nextId("e"), source: nodes[0].id, target: nodes[1].id },
      { id: nextId("e"), source: nodes[1].id, target: nodes[2].id },
      { id: nextId("e"), source: nodes[2].id, target: nodes[3].id, label: "cache" },
      { id: nextId("e"), source: nodes[2].id, target: nodes[4].id, label: "sql" },
      { id: nextId("e"), source: nodes[2].id, target: nodes[5].id, label: "enqueue" },
    ];
    return {
      reply:
        "Generated a starter system design: client → load balancer → API service, with Redis cache, Postgres, and a job queue.",
      nodes,
      edges,
    };
  }

  const add = message.match(ADD_RE);
  if (add) {
    const kind = kindFromWord(add[1]);
    const label = (add[2] ?? add[1]).replace(/^(called|named)\s+/i, "");
    const node = createNode(kind, label, {
      x: 120 + current.nodes.length * 40,
      y: 120 + current.nodes.length * 40,
    });
    const last = current.nodes[current.nodes.length - 1];
    const edge: CanvasEdge | undefined = last
      ? { id: nextId("e"), source: last.id, target: node.id }
      : undefined;
    return {
      reply: `Added ${kind} "${label}"${edge ? " and connected it to the previous node" : ""}.`,
      nodes: [node],
      edges: edge ? [edge] : [],
    };
  }

  if (
    lower.includes("what") ||
    lower.includes("explain") ||
    lower.includes("describe")
  ) {
    const counts = countByKind(current);
    return {
      reply: `Current design has ${current.nodes.length} components (${Object.entries(
        counts
      )
        .map(([k, v]) => `${v} ${k}`)
        .join(", ") || "none"}) and ${current.edges.length} connections.`,
    };
  }

  return {
    reply:
      'Try "generate a design", "add a cache", "add a postgres database", or "explain the current design".',
  };
}

export function countByKind(state: CanvasState): Record<string, number> {
  const out: Record<string, number> = {};
  for (const n of state.nodes) {
    out[n.data.kind] = (out[n.data.kind] ?? 0) + 1;
  }
  return out;
}

/** Produce a structured markdown spec from the canvas graph (Milestone 5). */
export function generateSpec(state: CanvasState, projectName: string): string {
  const lines: string[] = [];
  lines.push(`# ${projectName} — System Design Spec`);
  lines.push("");
  lines.push(`Generated from canvas on ${new Date().toISOString().slice(0, 10)}.`);
  lines.push("");

  lines.push("## Components");
  lines.push("");
  if (state.nodes.length === 0) {
    lines.push("_None yet._");
  }
  for (const n of state.nodes) {
    lines.push(`### ${n.data.label}`);
    lines.push(`- Type: ${n.data.kind}`);
    lines.push("");
  }

  lines.push("## Data Flow");
  lines.push("");
  if (state.edges.length === 0) {
    lines.push("_No connections yet._");
  }
  const byId = new Map(state.nodes.map((n) => [n.id, n.data.label]));
  for (const e of state.edges) {
    const src = byId.get(e.source) ?? e.source;
    const dst = byId.get(e.target) ?? e.target;
    lines.push(`- **${src}** → **${dst}**${e.label ? ` (${e.label})` : ""}`);
  }
  lines.push("");
  lines.push("## Interfaces");
  lines.push("");
  for (const n of state.nodes) {
    lines.push(`- \`${n.data.label}\`: TODO — define public API/contract.`);
  }
  lines.push("");
  lines.push("## Technology Choices");
  lines.push("");
  lines.push("- TODO — fill in chosen technologies per component.");
  lines.push("");
  return lines.join("\n");
}
