import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/** Returns the signed-in user and their role on the project, or null. */
export async function getProjectAccess(projectId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized", status: 401 as const };

  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user) return { error: "User not found", status: 404 as const };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      collaborators: { where: { userId: user.id } },
    },
  });
  if (!project) return { error: "Project not found", status: 404 as const };

  const isOwner = project.ownerId === user.id;
  const collab = project.collaborators[0];
  if (!isOwner && !collab)
    return { error: "Forbidden", status: 403 as const };

  const role = isOwner ? "OWNER" : collab.role;
  return { user, project, role, status: 200 as const };
}
