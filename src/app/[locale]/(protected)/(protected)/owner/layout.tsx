'use client'

import { AppLayout } from '@/components/app-layout'
import { useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  if (!isPending && !session) {
    router.replace('/login')
  }

  return <AppLayout>{children}</AppLayout>
}