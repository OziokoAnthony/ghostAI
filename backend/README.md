# backend/

Background jobs, run by Trigger.dev. Kept out of the Next.js app so long-running
AI work doesn't tie up a web request.

## trigger/ai-chat.ts

The only job today, id `ai-chat`:

1. Publishes progress metadata ("Interpreting your message…").
2. Calls `runWithOpenAI` (`frontend/src/lib/ai-agent.ts`) to turn the chat
   message + current canvas into canvas mutations.
3. If OpenAI fails, falls back to the local interpreter
   (`interpretInstruction` in `frontend/src/lib/canvas.ts`).
4. Returns the `AgentResult` JSON, which the frontend reads via
   `GET /api/projects/[id]/chat/run/[runId]`.

Run locally with `npm run dev`, deploy with `npm run deploy`.
