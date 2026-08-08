type ImageSize = 'thumbnail' | 'card' | 'detail' | 'original'

const transformations: Record<ImageSize, string> = {
  thumbnail: 'w_200,h_150,c_fill,q_60,f_auto',
  card: 'w_400,h_300,c_fill,q_75,f_auto',
  detail: 'w_800,h_600,c_fill,q_85,f_auto',
  original: 'q_auto,f_auto',
}

export function getOptimizedImageUrl(url: string | null | undefined, size: ImageSize = 'card'): string {
  if (!url) return '/placeholder-property.png'

  const cloudinaryRegex = /res\.cloudinary\.com\/([^/]+)\/image\/upload\/(.+)/
  const match = url.match(cloudinaryRegex)

  if (match) {
    const cloudName = match[1]
    const publicIdWithExtension = match[2]
    const transform = transformations[size]

    return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicIdWithExtension}`
  }

  return url
}
