// POST sync the Clerk user into our DB.

import { NextResponse } from "next/server";
import { syncUser } from "@/lib/sync-user";

export async function POST() {
  const result = await syncUser();

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json(result.user);
}
