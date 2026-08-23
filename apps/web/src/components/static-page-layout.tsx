"use client";

import { ReactNode } from "react";

interface StaticPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function StaticPageLayout({
  title,
  lastUpdated,
  children,
}: StaticPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            {title}
          </h1>
          {lastUpdated && (
            <p className="mt-2 text-sm text-muted-foreground">
              Terakhir diperbarui: {lastUpdated}
            </p>
          )}
        </header>
        <div className="border-b" />
        <main className="prose prose-neutral dark:prose-invert max-w-none">
          <div className="mt-8 space-y-6 text-foreground">{children}</div>
        </main>
      </div>
    </div>
  );
}
