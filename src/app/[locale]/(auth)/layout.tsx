import type { ReactNode } from 'react'
import { Logo } from '@/components/ui/logo'

export default function AuthLayout({ children }: { children: ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background p-4">
			<Logo withText className="h-10 mb-6" />
			{children}
		</div>
	)
}