'use client'

import { useSession } from '@/lib/auth-client'
import { AppLayout } from '@/components/app-layout'
import type { Role } from '@/lib/auth'
import type { SessionUserWithRole } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/config'
import { useEffect } from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const t = useTranslations('role')

  useEffect(() => {
    if (!isPending && !session) {
      router.replace({ pathname: '/login' })
    }
  }, [session, isPending, router])

  const user = session?.user as SessionUserWithRole | undefined
  useEffect(() => {
    if (!isPending && !['admin', 'staff'].includes((user?.role as Role | undefined) ?? '')) {
      router.replace({ pathname: '/dashboard' })
    }
  }, [user, isPending, router])

  return <AppLayout role="admin">{children}</AppLayout>
}