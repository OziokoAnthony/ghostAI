import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        { collaborators: { some: { userId: user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: user.id,
      collaborators: {
        create: { userId: user.id, role: "OWNER" },
      },
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
