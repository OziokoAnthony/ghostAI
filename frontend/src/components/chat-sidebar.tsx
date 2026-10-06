"use client";

// Chat UI: sends messages, polls Trigger.dev runs, pushes patches to the canvas.

import { useEffect, useState } from "react";

interface Msg {
  id: string;
  role: string;
  content: string;
}

export default function ChatSidebar({ projectId }: { projectId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/chat`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setMessages)
      .catch(() => setMessages([]));
  }, [projectId]);

  const send = async () => {
    const content = input.trim();
    if (!content || busy) return;
    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content }]);
    try {
      const res = await fetch(`/api/projects/${projectId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = await res.json();
      if (data.pending && data.runId) {
        // Trigger.dev path: poll for progress and completion
        let progress = "AI is working…";
        const tick = async (): Promise<void> => {
          const r = await fetch(
            `/api/projects/${projectId}/chat/run/${data.runId}`
          );
          const s = await r.json();
          if (s.progress) progress = s.progress;
          setProgress(progress);
          if (s.status === "COMPLETED") {
            if (s.message) setMessages((m) => [...m, s.message]);
            if (s.patch)
              window.dispatchEvent(
                new CustomEvent("canvas:patch", { detail: s.patch })
              );
            setProgress(null);
            return;
          }
          if (s.error) {
            setProgress(null);
            setMessages((m) => [
              ...m,
              { id: `err-${Date.now()}`, role: "agent", content: s.error },
            ]);
            return;
          }
          await new Promise((r2) => setTimeout(r2, 1500));
          return tick();
        };
        await tick();
      } else {
        if (data.message) {
          setMessages((m) => [...m, data.message]);
        }
        if (data.patch) {
          window.dispatchEvent(
            new CustomEvent("canvas:patch", { detail: data.patch })
          );
        }
        if (data.error) {
          setMessages((m) => [
            ...m,
            { id: `err-${Date.now()}`, role: "agent", content: data.error },
          ]);
        }
      }
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold">AI Agent Chat</h2>
      <div className="flex-1 space-y-2 overflow-y-auto text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded p-2 ${m.role === "user" ? "bg-indigo-50" : "bg-gray-100"}`}
          >
            <span className="text-xs font-bold uppercase text-gray-500">
              {m.role}
            </span>
            <p>{m.content}</p>
          </div>
        ))}
        {busy && (
          <p className="text-xs text-gray-400">{progress ?? "AI is working…"}</p>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-sm"
          placeholder='e.g. "add a redis cache"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={busy}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
