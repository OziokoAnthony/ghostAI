import { NextRequest, NextResponse } from "next/server";
import { getProjectAccess } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const access = await getProjectAccess(id);
  if ("error" in access)
    return NextResponse.json({ error: access.error }, { status: access.status });

  if (access.role !== "OWNER")
    return NextResponse.json(
      { error: "Only the owner can manage sharing" },
      { status: 403 }
    );

  const token = randomBytes(12).toString("hex");
  await prisma.project.update({
    where: { id },
    data: { shareToken: token },
  });

  return NextResponse.json({ url: `/share/${id}?token=${token}` });
}
