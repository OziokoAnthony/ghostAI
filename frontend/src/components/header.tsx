"use client";

// Top nav bar.

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Header() {
  const { user } = useUser();

  return (
    <header className="border-b px-8 py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold">
          System Design Workspace
        </Link>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-gray-600">
              {user.fullName || user.primaryEmailAddress?.emailAddress}
            </span>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  );
}
