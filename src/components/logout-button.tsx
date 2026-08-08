'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from '@/config'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon } from '@hugeicons/core-free-icons'

export function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    await signOut()
    router.push({ pathname: '/login' })
  }

  return (
    <Button
      variant="ghost"
      className="w-full justify-start"
      onClick={handleLogout}
    >
      <HugeiconsIcon icon={ArrowRight01Icon} strokeWidth={2} />
      <span>Logout</span>
    </Button>
  )
}