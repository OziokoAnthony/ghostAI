"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        const project = await res.json();
        router.push(`/projects/${project.id}`);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        New Project
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-semibold">Create Project</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="My System Design"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              rows={3}
              placeholder="What are you designing?"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}
