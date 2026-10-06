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

  it("removes a node by label for 'remove X'", () => {
    const cache = createNode("cache", "Redis Cache", { x: 0, y: 0 });
    const api = createNode("service", "API", { x: 10, y: 10 });
    const state: CanvasState = {
      nodes: [cache, api],
      edges: [{ id: "e1", source: api.id, target: cache.id }],
    };
    const res = interpretInstruction("remove redis", state);
    expect(res.removeNodeIds).toEqual([cache.id]);
    expect(res.removeEdgeIds).toEqual(["e1"]);
  });

  it("connects two nodes for 'connect X to Y'", () => {
    const a = createNode("service", "API", { x: 0, y: 0 });
    const b = createNode("database", "Postgres", { x: 10, y: 10 });
    const res = interpretInstruction("connect API to Postgres", {
      nodes: [a, b],
      edges: [],
    });
    expect(res.edges).toHaveLength(1);
    expect(res.edges![0].source).toBe(a.id);
    expect(res.edges![0].target).toBe(b.id);
  });

  it("clears everything for 'clear'", () => {
    const a = createNode("service", "API", { x: 0, y: 0 });
    const res = interpretInstruction("clear", {
      nodes: [a],
      edges: [{ id: "e1", source: a.id, target: a.id }],
    });
    expect(res.removeNodeIds).toEqual([a.id]);
    expect(res.removeEdgeIds).toEqual(["e1"]);
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
