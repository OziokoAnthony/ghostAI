"use client";

// Creates/copies the read-only share link.

import { useState } from "react";

export default function ShareButton({ projectId }: { projectId: string }) {
  const [url, setUrl] = useState<string | null>(null);

  const share = async () => {
    const res = await fetch(`/api/projects/${projectId}/share`, {
      method: "POST",
    });
    const data = await res.json();
    if (data.url) {
      const full = `${window.location.origin}${data.url}`;
      setUrl(full);
      await navigator.clipboard.writeText(full).catch(() => {});
    } else {
      alert(data.error ?? "Could not create share link");
    }
  };

  return (
    <div>
      <button
        onClick={share}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
      >
        Share read-only link
      </button>
      {url && (
        <p className="mt-1 break-all text-xs text-gray-500">
          Copied: {url}
        </p>
      )}
    </div>
  );
}
