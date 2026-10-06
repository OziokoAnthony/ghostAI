"use client";

// Invite/remove/change roles of collaborators.

import { useState } from "react";
import { useRouter } from "next/navigation";

type Collaborator = {
  id: string;
  role: string;
  user: { id: string; name: string | null; email: string };
};

export default function CollaboratorManager({
  projectId,
  collaborators,
  isOwner,
}: {
  projectId: string;
  collaborators: Collaborator[];
  isOwner: boolean;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"EDITOR" | "VIEWER">("EDITOR");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await fetch(`/api/projects/${projectId}/collaborators`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });
      setEmail("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(collabId: string) {
    await fetch(`/api/projects/${projectId}/collaborators/${collabId}`, {
      method: "DELETE",
    });
    router.refresh();
  }

  async function handleRoleChange(collabId: string, newRole: string) {
    await fetch(`/api/projects/${projectId}/collaborators/${collabId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    router.refresh();
  }

  return (
    <div className="mt-6">
      <h3 className="font-semibold">Collaborators</h3>
      <ul className="mt-2 space-y-2">
        {collaborators.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded border px-3 py-2"
          >
            <div>
              <span className="font-medium">{c.user.name || c.user.email}</span>
              <span className="ml-2 text-sm text-gray-500">({c.role})</span>
            </div>
            {isOwner && (
              <div className="flex items-center gap-2">
                <select
                  value={c.role}
                  onChange={(e) => handleRoleChange(c.id, e.target.value)}
                  className="rounded border px-2 py-1 text-sm"
                >
                  <option value="EDITOR">Editor</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  onClick={() => handleRemove(c.id)}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {isOwner && (
        <form onSubmit={handleInvite} className="mt-4 flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="collab@example.com"
            className="flex-1 rounded border px-3 py-2"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "EDITOR" | "VIEWER")}
            className="rounded border px-3 py-2"
          >
            <option value="EDITOR">Editor</option>
            <option value="VIEWER">Viewer</option>
          </select>
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Invite
          </button>
        </form>
      )}
    </div>
  );
}
