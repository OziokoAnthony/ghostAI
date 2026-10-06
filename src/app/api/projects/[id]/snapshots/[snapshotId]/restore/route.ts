import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string; snapshotId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id, snapshotId } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  if (access.role === "VIEWER")
    return NextResponse.json({ error: "Viewers cannot restore" }, { status: 403 });

  const snapshot = await prisma.snapshot.findFirst({
    where: { id: snapshotId, projectId: id },
  });
  if (!snapshot)
    return NextResponse.json({ error: "Snapshot not found" }, { status: 404 });

  await prisma.project.update({
    where: { id },
    data: { canvasState: snapshot.state as object },
  });

  return NextResponse.json({ ok: true });
}
