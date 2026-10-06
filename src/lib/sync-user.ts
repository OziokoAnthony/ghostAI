import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncUser() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const clerkUser = await currentUser();
  if (!clerkUser) {
    return { error: "User not found", status: 404 as const };
  }

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    return { error: "No email found", status: 400 as const };
  }

  const user = await prisma.user.upsert({
    where: { clerkId: userId },
    update: {
      email,
      name: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkId: userId,
      email,
      name: clerkUser.fullName,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return { user, status: 200 as const };
}
