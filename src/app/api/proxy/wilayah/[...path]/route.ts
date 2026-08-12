import { NextRequest, NextResponse } from 'next/server'

const WILAYAH_API_BASE = 'https://www.emsifa.com/api-wilayah-indonesia/api'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const resolvedParams = await params
    const pathSegments = resolvedParams.path || []
    const targetUrl = `${WILAYAH_API_BASE}/${pathSegments.join('/')}${req.nextUrl.search}`

    const response = await fetch(targetUrl, {
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream API responded with ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch wilayah data' },
      { status: 500 }
    )
  }
}
