import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          System Design Workspace
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Real-time collaborative whiteboard for system design
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-lg border border-gray-300 px-6 py-3 hover:bg-gray-50"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
