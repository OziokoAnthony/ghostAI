"use client";

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
      if (data.message) {
        setMessages((m) => [...m, data.message]);
      }
      if (data.patch) {
        window.dispatchEvent(
          new CustomEvent("canvas:patch", { detail: data.patch })
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[600px] flex-col rounded-lg border p-3">
      <h2 className="mb-2 text-sm font-semibold">AI Agent Chat</h2>
      <div className="flex-1 space-y-2 overflow-y-auto text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded p-2 ${m.role === "user" ? "bg-sky-50" : "bg-gray-100"}`}
          >
            <span className="text-xs font-bold uppercase text-gray-500">
              {m.role}
            </span>
            <p>{m.content}</p>
          </div>
        ))}
        {busy && <p className="text-xs text-gray-400">AI is working…</p>}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded border px-2 py-1 text-sm"
          placeholder='e.g. "add a redis cache"'
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button
          onClick={send}
          disabled={busy}
          className="rounded bg-black px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
