import { MetadataRoute } from 'next'
import { db } from '@/db'
import { properties } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://konkosyuk.com'

  const activeProperties = await db
    .select({
      id: properties.id,
      updatedAt: properties.updatedAt,
    })
    .from(properties)
    .where(eq(properties.status, 'aktif'))

  const propertyUrls = activeProperties.map((property) => ({
    url: `${baseUrl}/properties/${property.id}`,
    lastModified: property.updatedAt,
    changeFrequency: 'weekly' as const,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...propertyUrls,
  ]
}