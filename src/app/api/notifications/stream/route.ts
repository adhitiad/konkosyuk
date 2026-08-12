export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import { requireSession } from '@/lib/auth'
import { eventEmitter } from '@/lib/notifications/event-emitter'

export async function GET(req: NextRequest) {
  const session = await requireSession()
  const userId = session.user.id

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        controller.enqueue(chunk)
      }

      const handler = (data: unknown) => {
        send(data)
      }

      eventEmitter.on(`notification:${userId}`, handler)

      const pingInterval = setInterval(() => {
        const chunk = encoder.encode(': ping\n\n')
        controller.enqueue(chunk)
      }, 15000)

      const cleanup = () => {
        clearInterval(pingInterval)
        eventEmitter.off(`notification:${userId}`, handler)
        controller.close()
      }

      req.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
