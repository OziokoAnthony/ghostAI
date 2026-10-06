"use client";

// List snapshots + create + restore.

import { useEffect, useState } from "react";

interface Snap {
  id: string;
  label: string | null;
  createdBy: string;
  createdAt: string;
}

export default function SnapshotPanel({
  projectId,
}: {
  projectId: string;
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);

  const load = () =>
    fetch(`/api/projects/${projectId}/snapshots`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSnaps)
      .catch(() => setSnaps([]));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const create = async () => {
    const label = prompt("Snapshot label (optional):") ?? "";
    await fetch(`/api/projects/${projectId}/snapshots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    load();
  };

  const restore = async (id: string) => {
    if (!confirm("Restore this snapshot? Unsaved changes will be replaced."))
      return;
    const res = await fetch(
      `/api/projects/${projectId}/snapshots/${id}/restore`,
      { method: "POST" }
    );
    if (res.ok) window.location.reload();
  };

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Snapshots</h2>
        <button onClick={create} className="rounded border px-2 py-1 text-xs">
          Take snapshot
        </button>
      </div>
      {snaps.length === 0 ? (
        <p className="text-xs text-gray-400">No snapshots yet.</p>
      ) : (
        <ul className="space-y-1 text-xs">
          {snaps.map((s) => (
            <li key={s.id} className="flex items-center justify-between">
              <span>
                {s.label || "snapshot"} · {s.createdBy} ·{" "}
                {new Date(s.createdAt).toLocaleString()}
              </span>
              <button
                onClick={() => restore(s.id)}
                className="rounded border px-2 py-0.5"
              >
                Restore
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
