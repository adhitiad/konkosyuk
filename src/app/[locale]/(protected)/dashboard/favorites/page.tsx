import { db } from "@/db";
import { favorites, properties } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import FavoriteButtonClient from "./favorite-button-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon } from "@hugeicons/core-free-icons";

interface FavoriteProperty {
  id: string;
  propertyId: string;
  propertyName: string | null;
  propertyAddress: string | null;
  propertyType: string | null;
  propertyBasePrice: string | null;
}

async function ambilFavorit(): Promise<FavoriteProperty[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  const data = await db
    .select({
      id: favorites.id,
      propertyId: favorites.propertyId,
      propertyName: properties.name,
      propertyAddress: properties.address,
      propertyType: properties.type,
      propertyBasePrice: properties.basePrice,
    })
    .from(favorites)
    .leftJoin(properties, eq(favorites.propertyId, properties.id))
    .where(eq(favorites.userId, session.user.id))
    .orderBy(desc(favorites.createdAt));

  return data;
}

export default async function FavoritesPage() {
  const favorites = await ambilFavorit();

  return (
    <div className="container py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Favorit</h1>
        <p className="text-muted-foreground">Properti yang kamu simpan</p>
      </div>

      {favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-lg font-medium">Belum ada favorit</p>
          <p className="text-muted-foreground">
            Klik heart icon di properti untuk menyimpan
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {favorites.map((fav) => (
            <Card key={fav.id} className="flex flex-col">
              <div className="relative h-48 w-full bg-muted">
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <span className="text-sm">Gambar tidak tersedia</span>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-1">
                    {fav.propertyName}
                  </CardTitle>
                  <Badge variant="secondary">
                    {fav.propertyType === "kost" ? "Kost" : "Kontrakan"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {fav.propertyAddress}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <Badge variant="outline">{fav.propertyAddress}</Badge>
                  <div className="flex gap-2">
                    <FavoriteButtonClient
                      propertyId={fav.propertyId}
                      initialFavorite
                    />
                    <Button
                      render={<Link href={`/properties/${fav.propertyId}`} />}
                      size="sm"
                      nativeButton={false}
                    >
                      Lihat
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
