import { Navbar } from '@/components/public-header'
import { PublicFooter } from '@/components/public-footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <PublicFooter />
    </div>
  )
}
