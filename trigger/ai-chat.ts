import { task } from "@trigger.dev/sdk/v3";
import { runWithOpenAI } from "@/lib/ai-agent";
import type { CanvasState } from "@/lib/canvas";

export const aiChatTask = task({
  id: "ai-chat",
  maxDuration: 120,
  run: async (payload: { message: string; current: CanvasState }) => {
    return runWithOpenAI(payload.message, payload.current);
  },
});
