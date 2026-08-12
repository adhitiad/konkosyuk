import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth'
import { getRedis } from '@/lib/redis'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await requireSession()
  const userId = session.user.id
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      let delivered = new Set<string>()
      const send = (data: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      const poll = async () => {
        try {
          const events = await (await getRedis()).range<{ id?: string }>(`notification-events:${userId}`, -20, -1)
          for (const event of events) {
            const eventId = event.id ?? JSON.stringify(event)
            if (!delivered.has(eventId)) { delivered.add(eventId); send(event) }
          }
          if (delivered.size > 100) delivered = new Set(Array.from(delivered).slice(-50))
        } catch { /* Redis fallback handles unavailable providers. */ }
      }
      void poll()
      const interval = setInterval(() => void poll(), 3000)
      const ping = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 15000)
      req.signal.addEventListener('abort', () => { clearInterval(interval); clearInterval(ping); controller.close() })
    },
  })
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' } })
}
