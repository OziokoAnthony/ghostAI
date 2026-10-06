import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateCollaboratorSchema = z.object({
  role: z.enum(["EDITOR", "VIEWER"]),
});

type Params = { params: Promise<{ id: string; collabId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, collabId } = await params;
  const body = await req.json();
  const parsed = updateCollaboratorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const owner = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!owner) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id, ownerId: owner.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const collaborator = await prisma.collaborator.update({
    where: { id: collabId },
    data: { role: parsed.data.role },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(collaborator);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, collabId } = await params;

  const owner = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!owner) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const project = await prisma.project.findFirst({
    where: { id, ownerId: owner.id },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  await prisma.collaborator.delete({ where: { id: collabId } });

  return NextResponse.json({ success: true });
}
