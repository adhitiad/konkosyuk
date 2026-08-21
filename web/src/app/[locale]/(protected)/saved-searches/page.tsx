import { Suspense } from "react";
import { SavedSearchesClient } from "./saved-searches-client";

export default function SavedSearchesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pencarian Tersimpan</h1>
      <Suspense fallback={<div className="text-muted-foreground">Memuat...</div>}>
        <SavedSearchesClient />
      </Suspense>
    </div>
  );
}
