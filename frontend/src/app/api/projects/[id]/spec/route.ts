// GET the generated markdown spec for the current canvas.

import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { generateSpec, type CanvasState } from "@/lib/canvas";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const state = (access.project.canvasState as CanvasState | null) ?? {
    nodes: [],
    edges: [],
  };

  return NextResponse.json({
    spec: generateSpec(state, access.project.name),
  });
}
