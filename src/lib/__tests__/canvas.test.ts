import { describe, it, expect } from "vitest";
import {
  createNode,
  interpretInstruction,
  generateSpec,
  countByKind,
  emptyCanvas,
  type CanvasState,
} from "../canvas";

describe("createNode", () => {
  it("creates a node with a unique id and given kind", () => {
    const a = createNode("service", "API", { x: 0, y: 0 });
    const b = createNode("service", "API", { x: 0, y: 0 });
    expect(a.id).not.toBe(b.id);
    expect(a.data.kind).toBe("service");
    expect(a.data.label).toBe("API");
  });
});

describe("interpretInstruction", () => {
  it("generates a full design for 'generate a design'", () => {
    const res = interpretInstruction("generate a design", emptyCanvas);
    expect(res.nodes!.length).toBeGreaterThan(3);
    expect(res.edges!.length).toBeGreaterThan(3);
  });

  it("adds a cache node for 'add a redis cache'", () => {
    const res = interpretInstruction("add a redis cache", emptyCanvas);
    expect(res.nodes![0].data.kind).toBe("cache");
  });

  it("summarizes existing canvas for 'explain'", () => {
    const state: CanvasState = {
      nodes: [createNode("database", "DB", { x: 0, y: 0 })],
      edges: [],
    };
    const res = interpretInstruction("explain the current design", state);
    expect(res.reply).toContain("1 components");
    expect(res.nodes).toBeUndefined();
  });
});

describe("countByKind", () => {
  it("counts nodes per kind", () => {
    const state: CanvasState = {
      nodes: [
        createNode("service", "a", { x: 0, y: 0 }),
        createNode("service", "b", { x: 0, y: 0 }),
        createNode("queue", "q", { x: 0, y: 0 }),
      ],
      edges: [],
    };
    expect(countByKind(state)).toEqual({ service: 2, queue: 1 });
  });
});

describe("generateSpec", () => {
  it("includes component names, types, and edges", () => {
    const api = createNode("service", "API", { x: 0, y: 0 });
    const db = createNode("database", "Postgres", { x: 0, y: 0 });
    const spec = generateSpec(
      {
        nodes: [api, db],
        edges: [{ id: "e1", source: api.id, target: db.id, label: "sql" }],
      },
      "MyProject"
    );
    expect(spec).toContain("# MyProject — System Design Spec");
    expect(spec).toContain("### API");
    expect(spec).toContain("Type: database");
    expect(spec).toContain("**API** → **Postgres** (sql)");
  });

  it("handles an empty canvas", () => {
    const spec = generateSpec(emptyCanvas, "Empty");
    expect(spec).toContain("_None yet._");
  });
});
