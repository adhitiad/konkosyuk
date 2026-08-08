import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage-manager'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as 'avatar' | 'property') || 'avatar'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    const result = await uploadFile(file, type)

    return NextResponse.json({ url: result.url, provider: result.provider })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    )
  }
}
