import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  const snapshots = await prisma.snapshot.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, createdBy: true, createdAt: true },
  });
  return NextResponse.json(snapshots);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  if (access.role === "VIEWER")
    return NextResponse.json({ error: "Viewers cannot snapshot" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const state = access.project.canvasState ?? { nodes: [], edges: [] };

  const snapshot = await prisma.snapshot.create({
    data: {
      projectId: id,
      state,
      label: typeof body?.label === "string" ? body.label : null,
      createdBy: access.user.email,
    },
  });

  // Vercel Blob: also archive the serialized snapshot when configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(
        `snapshots/${id}/${snapshot.id}.json`,
        JSON.stringify(state),
        { access: "public", contentType: "application/json" }
      );
      await prisma.snapshot.update({
        where: { id: snapshot.id },
        data: { blobUrl: blob.url },
      });
      return NextResponse.json(
        { ...snapshot, blobUrl: blob.url },
        { status: 201 }
      );
    } catch {
      // Fall back to DB-only snapshot
    }
  }

  return NextResponse.json(snapshot, { status: 201 });
}
