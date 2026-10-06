import { task, metadata } from "@trigger.dev/sdk/v3";
import { runWithOpenAI } from "@/lib/ai-agent";
import { interpretInstruction, type CanvasState } from "@/lib/canvas";

export const aiChatTask = task({
  id: "ai-chat",
  maxDuration: 120,
  run: async (payload: { message: string; current: CanvasState }) => {
    metadata.set("progress", "Interpreting your message…");
    try {
      metadata.set("progress", "Generating canvas changes…");
      const result = await runWithOpenAI(payload.message, payload.current);
      metadata.set("progress", "Done");
      return result;
    } catch (err) {
      metadata.set("progress", "Falling back to local interpreter");
      return interpretInstruction(payload.message, payload.current);
    }
  },
});
