import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]).default("EDITOR"),
});

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = inviteSchema.safeParse(body);

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

  const invitedUser = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!invitedUser) {
    return NextResponse.json(
      { error: "No user found with that email. They must sign up first." },
      { status: 404 }
    );
  }

  const existing = await prisma.collaborator.findUnique({
    where: {
      projectId_userId: { projectId: id, userId: invitedUser.id },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "User is already a collaborator" },
      { status: 409 }
    );
  }

  const collaborator = await prisma.collaborator.create({
    data: {
      projectId: id,
      userId: invitedUser.id,
      role: parsed.data.role,
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(collaborator, { status: 201 });
}
