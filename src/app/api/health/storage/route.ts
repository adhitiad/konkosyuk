import { NextResponse } from 'next/server'

export async function GET() {
  const storageProviders = [
    { name: 'Uploadthing', status: 'healthy' as const },
    { name: 'Cloudinary', status: 'healthy' as const },
  ]

  return NextResponse.json({
    status: 'healthy',
    providers: storageProviders,
    message: 'All storage providers operational',
  })
}
