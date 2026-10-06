"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type NodeProps,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng, toSvg } from "html-to-image";
import {
  createNode,
  type CanvasState,
  type ShapeKind,
} from "@/lib/canvas";

const KINDS: ShapeKind[] = [
  "client",
  "service",
  "database",
  "queue",
  "loadbalancer",
  "cache",
];

const KIND_COLORS: Record<ShapeKind, string> = {
  client: "bg-slate-100 border-slate-400",
  service: "bg-blue-100 border-blue-400",
  database: "bg-emerald-100 border-emerald-400",
  queue: "bg-amber-100 border-amber-400",
  loadbalancer: "bg-violet-100 border-violet-400",
  cache: "bg-rose-100 border-rose-400",
};

function ShapeNode({ data, selected }: NodeProps) {
  const kind = (data.kind as ShapeKind) ?? "service";
  return (
    <div
      className={`rounded-md border-2 px-4 py-2 text-sm font-medium shadow ${KIND_COLORS[kind]} ${selected ? "ring-2 ring-sky-500" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="text-[10px] uppercase text-gray-500">{kind}</div>
      <div>{String(data.label ?? "")}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

const nodeTypes = { shape: ShapeNode };

interface Props {
  projectId: string;
  initialState: CanvasState;
  readOnly?: boolean;
  /** When true, skip autosaving to the API (used by the public share page). */
  disableSave?: boolean;
}

function Board({ projectId, initialState, readOnly, disableSave }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    (initialState?.nodes ?? []) as any[]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    (initialState?.edges ?? []) as any[]
  );
  const wrapperRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "offline">(
    "saved"
  );
  const { zoomIn, zoomOut, fitView, screenToFlowPosition } = useReactFlow();

  // Undo/redo history (Milestone 2 keyboard shortcuts)
  const history = useRef<CanvasState[]>([]);
  const future = useRef<CanvasState[]>([]);
  const snapshot = useCallback(() => {
    history.current.push({
      nodes: nodes as unknown as CanvasState["nodes"],
      edges: edges as unknown as CanvasState["edges"],
    });
    future.current = [];
  }, [nodes, edges]);

  // Debounced auto-save (Milestone 3)
  useEffect(() => {
    if (readOnly || disableSave) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaveState("saving");
    saveTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/canvas`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nodes, edges }),
        });
        setSaveState(res.ok ? "saved" : "offline");
      } catch {
        setSaveState("offline");
      }
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges]);

  const onConnect = useCallback(
    (conn: Connection) => {
      snapshot();
      setEdges((eds) => addEdge({ ...conn, animated: true }, eds));
    },
    [setEdges, snapshot]
  );

  // Chat agent patches the canvas via a window event
  useEffect(() => {
    const onPatch = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        nodes?: unknown[];
        edges?: unknown[];
      };
      if (detail.nodes) {
        history.current.push({
          nodes: nodes as any,
          edges: edges as any,
        });
        if (detail.nodes.length) setNodes((nds) => nds.concat(detail.nodes as any[]));
      }
      if (detail.edges?.length)
        setEdges((eds) => eds.concat(detail.edges as any[]));
    };
    window.addEventListener("canvas:patch", onPatch);
    return () => window.removeEventListener("canvas:patch", onPatch);
  }, [nodes, edges, setNodes, setEdges]);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const kind = event.dataTransfer.getData("application/kind") as ShapeKind;
      if (!kind) return;
      snapshot();
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const node = createNode(kind, kind, position);
      setNodes((nds) => nds.concat(node as any));
    },
    [screenToFlowPosition, setNodes, snapshot]
  );

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Keyboard shortcuts: undo (Ctrl+Z), redo (Ctrl+Y), zoom
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "z") {
        const prev = history.current.pop();
        if (prev) {
          future.current.push({
            nodes: nodes as any,
            edges: edges as any,
          });
          setNodes(prev.nodes as any[]);
          setEdges(prev.edges as any[]);
        }
      } else if (e.key === "y") {
        const next = future.current.pop();
        if (next) {
          history.current.push({
            nodes: nodes as any,
            edges: edges as any,
          });
          setNodes(next.nodes as any[]);
          setEdges(next.edges as any[]);
        }
      } else if (e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") fitView();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [nodes, edges, setNodes, setEdges, zoomIn, zoomOut, fitView]);

  const exportImage = async (format: "png" | "svg") => {
    const el = wrapperRef.current?.querySelector(".react-flow") as HTMLElement;
    if (!el) return;
    const dataUrl =
      format === "png" ? await toPng(el) : await toSvg(el);
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `diagram.${format}`;
    a.click();
  };

  return (
    <div className="flex h-[600px] gap-4" ref={wrapperRef}>
      {!readOnly && (
        <div className="flex w-32 flex-col gap-2">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Drag to canvas
          </p>
          {KINDS.map((k) => (
            <div
              key={k}
              draggable
              onDragStart={(e) =>
                e.dataTransfer.setData("application/kind", k)
              }
              className={`cursor-grab rounded border-2 px-2 py-1 text-xs ${KIND_COLORS[k]}`}
            >
              {k}
            </div>
          ))}
          <p className="mt-2 text-[10px] text-gray-400">
            Ctrl+Z undo · Ctrl+Y redo · Ctrl+=/-/0 zoom
          </p>
          <button
            onClick={() => exportImage("png")}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          >
            Export PNG
          </button>
          <button
            onClick={() => exportImage("svg")}
            className="rounded border px-2 py-1 text-xs hover:bg-gray-50"
          >
            Export SVG
          </button>
        </div>
      )}
      <div className="relative flex-1 rounded-lg border">
        <div className="absolute right-2 top-2 z-10 rounded bg-white/80 px-2 py-0.5 text-xs text-gray-500">
          {readOnly ? "read-only" : saveState}
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={readOnly ? undefined : onNodesChange}
          onEdgesChange={readOnly ? undefined : onEdgesChange}
          onConnect={readOnly ? undefined : onConnect}
          onDrop={readOnly ? undefined : onDrop}
          onDragOver={readOnly ? undefined : onDragOver}
          nodeTypes={nodeTypes}
          nodesDraggable={!readOnly}
          nodesConnectable={!readOnly}
          elementsSelectable={!readOnly}
          deleteKeyCode={readOnly ? null : ["Backspace", "Delete"]}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}

export default function CanvasBoard(props: Props) {
  return (
    <ReactFlowProvider>
      <Board {...props} />
    </ReactFlowProvider>
  );
}
