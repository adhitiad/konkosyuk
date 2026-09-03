import { db } from './src/db';
import { webhookEvents, payments, bookings } from './src/db/schema';
import { desc } from 'drizzle-orm';

async function run() {
  const latestEvents = await db.select().from(webhookEvents).orderBy(desc(webhookEvents.createdAt)).limit(3);
  console.log('Latest Webhook Events:', JSON.stringify(latestEvents, null, 2));

  const latestPayments = await db.select().from(payments).orderBy(desc(payments.createdAt)).limit(3);
  console.log('Latest Payments:', JSON.stringify(latestPayments, null, 2));

  const latestBookings = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(3);
  console.log('Latest Bookings:', JSON.stringify(latestBookings, null, 2));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
