import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { requireSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File harus berupa gambar' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public/uploads/avatars')
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${session.user.id}-${Date.now()}.${ext}`
    const filepath = path.join(uploadDir, filename)

    await writeFile(filepath, buffer)

    const publicUrl = `/uploads/avatars/${filename}`
    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload avatar error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
