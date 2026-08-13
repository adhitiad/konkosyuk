import { MetadataRoute } from 'next'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL1 || process.env.NEXT_PUBLIC_APP_URL || 'https://konkosyuk.com').replace(/\/+$/, '')
  const locale = 'id'
  const generatedAt = new Date()

  const activeProperties = await db
    .select({
      id: properties.id,
      updatedAt: properties.updatedAt,
    })
    .from(properties)
    .where(eq(properties.status, 'aktif'))

  const propertyUrls = activeProperties.map((property) => ({
    url: `${baseUrl}/${locale}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: 'weekly' as const,
  }))

  return [
    {
      url: `${baseUrl}/${locale}`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/${locale}/properties`,
      lastModified: generatedAt,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...propertyUrls,
  ]
}
