import type { ReactNode } from "react";
import { Navbar } from "@/components/public-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <Navbar />
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-muted/30 to-background shadow-2xl shadow-black/5">
        {children}
      </div>
    </div>
  );
}
