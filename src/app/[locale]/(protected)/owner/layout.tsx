'use client'

import { useSession } from '@/lib/auth-client'
import { AppLayout } from '@/components/app-layout'
import type { Role } from '@/lib/auth'
import type { SessionUserWithRole } from '@/lib/auth-client'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/config'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const t = useTranslations('role')

  if (!isPending && !session) {
    router.replace({ pathname: '/login' })
  }

  const user = session?.user as SessionUserWithRole | undefined
  if (!isPending && (user?.role as Role | undefined) !== 'owner') {
    router.replace({ pathname: '/dashboard' })
  }

  return <AppLayout>{children}</AppLayout>
}