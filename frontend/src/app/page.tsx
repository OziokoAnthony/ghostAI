// Landing page; redirects based on auth state.

import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-8">
      <div className="text-center">
        <p className="mb-3 inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-700">
          Ghost AI
        </p>
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900">
          System Design Workspace
        </h1>
        <p className="mt-4 text-lg text-slate-600">
          Real-time collaborative whiteboard for system design
        </p>
      </div>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="rounded-xl bg-indigo-600 px-6 py-3 font-medium text-white shadow-md transition hover:bg-indigo-700 hover:shadow-lg"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
