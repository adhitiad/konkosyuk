import { NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { getRedis } from "@/lib/redis";
import { encodeSSE, encodeSSEPing } from "@/lib/perf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await requireSession();
  const userId = session.user.id;
  let interval: ReturnType<typeof setInterval> | undefined;
  let ping: ReturnType<typeof setInterval> | undefined;
  let closeStream: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const delivered = new Set<string>();
      const lastEventId = req.headers.get("last-event-id");
      if (lastEventId) delivered.add(lastEventId);

      const close = () => {
        if (closed) return;
        closed = true;
        if (interval) {
          clearInterval(interval);
          interval = undefined;
        }
        if (ping) {
          clearInterval(ping);
          ping = undefined;
        }
        try {
          controller.close();
        } catch {
          // Stream already closed or errored
        }
      };
      closeStream = close;

      const send = (id: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encodeSSE(id, "notification", data));
        } catch {
          close();
        }
      };

      const poll = async () => {
        if (closed) return;
        try {
          const redis = await getRedis();
          const events = await redis.range<{ id?: string }>(
            `notification-events:${userId}`,
            -20,
            -1,
          );
          if (closed) return;
          for (const event of events) {
            const eventId = event.id ?? JSON.stringify(event);
            if (!delivered.has(eventId)) {
              delivered.add(eventId);
              send(eventId, event);
            }
          }
          if (delivered.size > 100) {
            const recent = Array.from(delivered).slice(-50);
            delivered.clear();
            recent.forEach((id) => delivered.add(id));
          }
        } catch {
          /* Redis fallback handles unavailable providers. */
        }
      };

      void poll();
      interval = setInterval(() => void poll(), 5000);
      ping = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encodeSSEPing());
        } catch {
          close();
        }
      }, 15000);

      req.signal.addEventListener("abort", close, { once: true });
    },
    cancel() {
      closeStream?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Content-Encoding": "identity",
    },
  });
}


