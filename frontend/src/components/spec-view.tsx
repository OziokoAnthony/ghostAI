"use client";

// Shows the generated spec with regenerate/copy/download.

import { useEffect, useState } from "react";

export default function SpecView({ projectId }: { projectId: string }) {
  const [spec, setSpec] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/spec`);
      const data = await res.json();
      setSpec(data.spec ?? "");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const copy = () => navigator.clipboard.writeText(spec);
  const download = () => {
    const blob = new Blob([spec], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spec.md";
    a.click();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Generated Spec</h2>
        <div className="flex gap-2">
          <button onClick={load} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50">
            {loading ? "…" : "Regenerate"}
          </button>
          <button onClick={copy} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50">
            Copy
          </button>
          <button onClick={download} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-50">
            Download .md
          </button>
        </div>
      </div>
      <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs">
        {spec || "Nothing on the canvas yet — add shapes to generate a spec."}
      </pre>
    </div>
  );
}
