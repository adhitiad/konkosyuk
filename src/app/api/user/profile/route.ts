import { NextRequest } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { requireSession } from '@/lib/auth'
import { ok, fail, handleApiError } from '@/lib/api'
import { z } from 'zod'

const updateProfileSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(255),
  phone: z.string().min(1, 'Nomor telepon wajib diisi').max(20),
  image: z.string().url('URL gambar tidak valid').optional().nullable(),
  province: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  district: z.string().optional().nullable(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireSession()
    const body = updateProfileSchema.parse(await req.json())

    const [updated] = await db
      .update(users)
      .set({
        name: body.name,
        phone: body.phone,
        image: body.image ?? null,
        province: body.province ?? null,
        city: body.city ?? null,
        district: body.district ?? null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.user.id))
      .returning()

    return ok({
      message: 'Profil berhasil diperbarui',
      user: updated,
    })
  } catch (error) {
    return handleApiError(error, 'PATCH /api/user/profile')
  }
}
