import { config } from 'dotenv'
import cron from 'node-cron'
import { cleanupExpiredBookings } from '../lib/cron/cleanup-bookings'

config()

const CRON_SCHEDULE = process.env.CRON_SCHEDULE || '0 * * * *'

async function runCleanup() {
  console.log(`[${new Date().toISOString()}] Running expired bookings cleanup...`)
  
  try {
    const result = await cleanupExpiredBookings()
    
    console.log('Cleanup completed:', {
      cancelledCount: result.cancelledCount,
      unitReleasedCount: result.unitReleasedCount,
      cancelledBookings: result.cancelledBookings.map(b => b.id),
    })
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  }
}

console.log(`Starting cron job with schedule: ${CRON_SCHEDULE}`)
console.log('Waiting for next execution...')

cron.schedule(CRON_SCHEDULE, runCleanup)

runCleanup()
