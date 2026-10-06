// PUT: autosave the whole canvas JSON.

import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  return NextResponse.json(access.project.canvasState ?? { nodes: [], edges: [] });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  if (access.role === "VIEWER")
    return NextResponse.json({ error: "Viewers cannot edit" }, { status: 403 });

  const body = await req.json();
  if (!Array.isArray(body?.nodes) || !Array.isArray(body?.edges))
    return NextResponse.json({ error: "Invalid canvas state" }, { status: 400 });

  await prisma.project.update({
    where: { id },
    data: { canvasState: { nodes: body.nodes, edges: body.edges } },
  });

  return NextResponse.json({ ok: true });
}
