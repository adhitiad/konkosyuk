import { db } from "@/db"
import { properties, units, bookings } from "@/db/schema"
import { eq, desc, and, or, sql } from "drizzle-orm"
import { notFound } from "next/navigation"
import { Metadata } from "next"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import BookingDialogClient from "./booking-dialog"
import UnitCard from "@/components/tenant/unit-card"
import { OptimizedImage } from "@/components/ui/optimized-image"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  MapPinIcon,
  WifiIcon,
  TvIcon,
  KitchenUtensilsIcon,
  ShowerHeadIcon,
  Car01Icon,
  DumbbellIcon,
  SecurityCheckIcon,
  BedDoubleIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons"
import type { PropertyPackages } from "@/lib/types/property-packages"
import { jitterCoordinates } from "@/lib/utils/location"

interface PropertyPageProps {
  params: Promise<{ locale: string; id: string }>
}

const propertyTypeLabels: Record<string, string> = {
  kost: "Kost",
  kontrakan: "Kontrakan",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(value)

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value))

const formatDuration = (value: number, unit: string) => {
  const unitLabels: Record<string, string> = {
    hours: 'Jam',
    days: 'Hari',
    months: 'Bulan',
    years: 'Tahun',
  }
  return `${value} ${unitLabels[unit] ?? unit}`
}

const amenityIcons: Record<string, React.ReactNode> = {
  wifi: <HugeiconsIcon icon={WifiIcon} strokeWidth={2} className="size-5" />,
  tv: <HugeiconsIcon icon={TvIcon} strokeWidth={2} className="size-5" />,
  kitchen: (
    <HugeiconsIcon icon={KitchenUtensilsIcon} strokeWidth={2} className="size-5" />
  ),
  shower: (
    <HugeiconsIcon icon={ShowerHeadIcon} strokeWidth={2} className="size-5" />
  ),
  parking: <HugeiconsIcon icon={Car01Icon} strokeWidth={2} className="size-5" />,
  gym: (
    <HugeiconsIcon icon={DumbbellIcon} strokeWidth={2} className="size-5" />
  ),
  security: (
    <HugeiconsIcon
      icon={SecurityCheckIcon}
      strokeWidth={2}
      className="size-5"
    />
  ),
  bed: <HugeiconsIcon icon={BedDoubleIcon} strokeWidth={2} className="size-5" />,
}

async function getProperty(id: string) {
  const [property] = await db
    .select()
    .from(properties)
    .where(eq(properties.id, id))
    .limit(1)

  return property ?? null
}

async function getUnits(propertyId: string) {
  return db
    .select()
    .from(units)
    .where(eq(units.propertyId, propertyId))
    .orderBy(desc(units.createdAt))
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { locale, id } = await params
  const property = await getProperty(id)

  if (!property) {
    return {
      title: "Properti Tidak Ditemukan | KonkosYuk",
      description: "Properti yang Anda cari tidak ditemukan.",
    }
  }

  const metadata = (property.metadata ?? {}) as Record<string, unknown>
  const imageUrl = (metadata.image as string | null | undefined) ?? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/logo.png`
  const description = property.description ?? `Cari ${propertyTypeLabels[property.type] ?? "properti"} di ${property.address}`
  const truncatedDescription = description.length > 160 ? description.slice(0, 157) + "..." : description
  const price = property.packages?.predefined?.[0]?.finalPrice ? Number(property.packages.predefined[0].finalPrice) : Number(property.basePrice ?? 0)

  return {
    title: `${property.name} - Sewa ${propertyTypeLabels[property.type] ?? "properti"} di ${property.city ?? property.address} | KonkosYuk`,
    description: `Sewa ${propertyTypeLabels[property.type] ?? "properti"} nyaman, aman, dan transparan di ${property.city ?? property.address}. Mulai dari Rp ${price.toLocaleString("id-ID")}/bulan. DP hanya 35%!`,
    openGraph: {
      title: `${property.name} | KonkosYuk`,
      description: `Sewa ${propertyTypeLabels[property.type] ?? "properti"} nyaman dan aman. DP hanya 35%!`,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/properties/${property.id}`,
      siteName: "Konkosyuk",
      locale: locale,
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: property.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${property.name} | KonkosYuk`,
      description: `Sewa ${propertyTypeLabels[property.type] ?? "properti"} nyaman dan aman. DP hanya 35%!`,
      images: [imageUrl],
    },
  }
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params
  const [property, propertyUnits] = await Promise.all([
    getProperty(id),
    getUnits(id),
  ])

  if (!property) {
    notFound()
  }

  const metadata = (property.metadata ?? {}) as Record<string, unknown>
  const amenities = Array.isArray(property.amenities)
    ? property.amenities
    : Array.isArray(metadata.amenities)
      ? (metadata.amenities as string[])
      : []
  const rules = metadata.rules as Record<string, unknown> | undefined
  const ogImage = (metadata.image as string | null | undefined) ?? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001"}/logo.png`

  const availableUnits = propertyUnits.filter((u) => u.status === "available")
  const bookedUnits = propertyUnits.filter((u) => u.status === "booked")

  let viewerId: string | null = null
  let isLocationMasked = false
  let maskedAddress = property.address
  let maskedLatitude = property.latitude
  let maskedLongitude = property.longitude

  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (session?.user?.id) {
      viewerId = session.user.id

      if (session.user.role !== 'admin' && property.ownerId !== session.user.id) {
        const [qualifyingBooking] = await db
          .select()
          .from(bookings)
          .where(
            and(
              eq(bookings.propertyId, property.id),
              eq(bookings.userId, session.user.id),
              or(
                eq(bookings.status, 'confirmed'),
                eq(bookings.status, 'awaiting_full_payment'),
              ),
            ),
          )
          .limit(1)

        if (!qualifyingBooking) {
          isLocationMasked = true
          maskedAddress =
            property.city && property.province
              ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
              : 'Lokasi Perkiraan'

          if (property.latitude && property.longitude) {
            const jittered = jitterCoordinates(Number(property.latitude), Number(property.longitude))
            maskedLatitude = String(jittered.lat)
            maskedLongitude = String(jittered.lng)
          }
        }
      }
    } else {
      isLocationMasked = true
      maskedAddress =
        property.city && property.province
          ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
          : 'Lokasi Perkiraan'

      if (property.latitude && property.longitude) {
        const jittered = jitterCoordinates(Number(property.latitude), Number(property.longitude))
        maskedLatitude = String(jittered.lat)
        maskedLongitude = String(jittered.lng)
      }
    }
  } catch {
    isLocationMasked = true
    maskedAddress =
      property.city && property.province
        ? `Lokasi Perkiraan di ${property.city}, ${property.province}`
        : 'Lokasi Perkiraan'

    if (property.latitude && property.longitude) {
      const jittered = jitterCoordinates(Number(property.latitude), Number(property.longitude))
      maskedLatitude = String(jittered.lat)
      maskedLongitude = String(jittered.lng)
    }
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{property.name}</h1>
          <Badge variant="secondary">
            {propertyTypeLabels[property.type] ?? property.type}
          </Badge>
        </div>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground">
          <HugeiconsIcon icon={MapPinIcon} strokeWidth={2} className="size-4" />
          <span>{maskedAddress}</span>
        </div>
        {isLocationMasked && (
          <div className="mt-2">
            <Badge variant="outline" className="text-xs">
              Alamat lengkap akan dibuka setelah Anda membayar DP 35%
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Galeri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex h-48 items-center justify-center rounded-xl bg-muted"
                  >
                    <OptimizedImage
                      src={null}
                      size="thumbnail"
                      alt={`${property.name} ${i + 1}`}
                      width={200}
                      height={150}
                      className="rounded-xl object-cover"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {amenities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Fasilitas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {amenities.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border p-3"
                    >
                      <div className="text-primary">
                        {amenityIcons[item] ?? (
                          <HugeiconsIcon
                            icon={Search01Icon}
                            strokeWidth={2}
                            className="size-5"
                          />
                        )}
                      </div>
                      <span className="text-sm capitalize">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {rules && Object.keys(rules).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Aturan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(rules).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-xl border p-3"
                    >
                      <span className="text-sm font-medium capitalize">
                        {key.replace(/_/g, " ")}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {typeof value === "boolean"
                          ? value
                            ? "Ya"
                            : "Tidak"
                          : String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Daftar Kamar / Unit Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              {propertyUnits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <HugeiconsIcon
                    icon={Search01Icon}
                    strokeWidth={2}
                    className="size-10 text-muted-foreground"
                  />
                  <p className="mt-3 text-sm font-medium">Belum ada kamar tersedia</p>
                  <p className="text-xs text-muted-foreground">
                    Owner belum membuka kamar untuk disewa. Silakan hubungi pemilik.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {propertyUnits.map((unit) => (
                    <UnitCard
                      key={unit.id}
                      unit={unit}
                      action={
                        unit.status === "available" ? (
                          <BookingDialogClient
                            unitId={unit.id}
                            unitName={unit.name}
                            propertyId={property.id}
                            packages={property.packages}
                          >
                            <Button className="w-full">Pilih Kamar</Button>
                          </BookingDialogClient>
                        ) : (
                          <Button className="w-full" disabled>
                            Tidak Tersedia
                          </Button>
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Properti</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipe</p>
                <p className="text-sm font-medium">
                  {propertyTypeLabels[property.type] ?? property.type}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Lokasi</p>
                <p className="text-sm font-medium">{property.address}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Deskripsi</p>
                <p className="text-sm text-muted-foreground">
                  {property.description ?? "Tidak ada deskripsi."}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Unit Tersedia</p>
                <p className="text-sm font-medium">
                  {availableUnits.length} dari {propertyUnits.length} unit
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daftar Paket Harga</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const packages = (property.packages ?? {}) as PropertyPackages
                const availablePackages = packages.predefined?.filter((p) => p.isAvailable) ?? []
                const customEnabled = packages.custom?.enabled ?? false

                if (availablePackages.length === 0 && !customEnabled) {
                  return (
                    <p className="text-sm text-muted-foreground">
                      Belum ada paket harga untuk properti ini.
                    </p>
                  )
                }

                return (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {availablePackages.map((pkg) => (
                      <div
                        key={pkg.id}
                        className="rounded-xl border p-4 flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{pkg.label}</span>
                          <Badge variant="secondary">
                            {formatDuration(pkg.value, pkg.unit)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Harga Dasar</span>
                            <span>{formatCurrency(pkg.basePrice)}</span>
                          </div>
                          {pkg.discountPercent > 0 && (
                            <div className="flex justify-between">
                              <span>Diskon</span>
                              <span>-{pkg.discountPercent}%</span>
                            </div>
                          )}
                          {(pkg.ppnPercent > 0 || pkg.appFeePercent > 0) && (
                            <div className="flex justify-between">
                              <span>PPN + App</span>
                              <span>+{pkg.ppnPercent}% + {pkg.appFeePercent}%</span>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between font-semibold text-sm mt-1">
                          <span>Harga Final</span>
                          <span>{formatCurrency(pkg.finalPrice)}</span>
                        </div>
                      </div>
                    ))}
                    {customEnabled && (
                      <div className="rounded-xl border p-4 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{packages.custom.label}</span>
                          <Badge variant="outline">Custom</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex justify-between">
                            <span>Harga per {packages.custom.unit}</span>
                            <span>{formatCurrency(packages.custom.pricePerUnit)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rentang Durasi</span>
                            <span>
                              {packages.custom.minDuration} - {packages.custom.maxDuration} {packages.custom.unit}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: property.name,
            description: property.description ?? undefined,
            image: ogImage,
            address: {
              '@type': 'PostalAddress',
              addressLocality: property.city ?? undefined,
              streetAddress: property.address,
            },
            offers: property.packages.predefined.length > 0
              ? {
                  '@type': 'Offer',
                  price: property.packages.predefined[0].finalPrice,
                  priceCurrency: 'IDR',
                  availability: 'https://schema.org/InStock',
                }
              : undefined,
          }),
        }}
      />
    </div>
  )
}
