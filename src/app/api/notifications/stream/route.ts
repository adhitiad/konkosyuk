import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireSession()
  const userId = session.user.id
  const encoder = new TextEncoder()
  let interval: ReturnType<typeof setInterval> | undefined
  let ping: ReturnType<typeof setInterval> | undefined
  let closeStream: (() => void) | undefined
  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const delivered = new Set<string>()
      const lastEventId = req.headers.get('last-event-id')
      if (lastEventId) delivered.add(lastEventId)
      const send = (id: string, data: unknown) => {
        if (closed) return
        controller.enqueue(encoder.encode(`id: ${id}\nevent: notification\ndata: ${JSON.stringify(data)}\n\n`))
      }
      const poll = async () => {
        try {
          const events = await (await getRedis()).range<{ id?: string }>(`notification-events:${userId}`, -20, -1)
          for (const event of events) {
            const eventId = event.id ?? JSON.stringify(event)
            if (!delivered.has(eventId)) { delivered.add(eventId); send(eventId, event) }
          }
          if (delivered.size > 100) {
            const recent = Array.from(delivered).slice(-50)
            delivered.clear()
            recent.forEach((id) => delivered.add(id))
          }
        } catch { /* Redis fallback handles unavailable providers. */ }
      }
      void poll()
      interval = setInterval(() => void poll(), 5000)
      ping = setInterval(() => { if (!closed) controller.enqueue(encoder.encode(': ping\n\n')) }, 15000)
      const close = () => {
        if (closed) return
        closed = true
        if (interval) clearInterval(interval)
        if (ping) clearInterval(ping)
        controller.close()
      }
      closeStream = close
      req.signal.addEventListener('abort', close, { once: true })
    },
    cancel() { closeStream?.() },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no', 'Content-Encoding': 'identity' } })
}
