'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { MultiplicationSignIcon, ChevronLeftIcon, ChevronRightIcon, Maximize01Icon } from '@hugeicons/core-free-icons'

interface ImageGalleryProps {
  images: string[]
  alt?: string
}

export default function ImageGallery({ images, alt = 'Gallery' }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  if (images.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-4xl bg-muted text-muted-foreground">
        <span className="text-sm">Tidak ada gambar</span>
      </div>
    )
  }

  const goToPrevious = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  const goToNext = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))

  return (
    <>
      <div className="relative">
        <div className="relative h-64 md:h-96 w-full overflow-hidden rounded-4xl bg-muted">
          <Image
            src={images[currentIndex]}
            alt={`${alt} - ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
        {images.length > 1 && (
          <>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur"
              onClick={goToPrevious}
            >
              <HugeiconsIcon icon={ChevronLeftIcon} strokeWidth={2} className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur"
              onClick={goToNext}
            >
              <HugeiconsIcon icon={ChevronRightIcon} strokeWidth={2} className="size-4" />
            </Button>
          </>
        )}
        <div className="absolute bottom-4 right-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="bg-background/80 backdrop-blur"
            onClick={() => setIsFullscreen(true)}
          >
            <HugeiconsIcon icon={Maximize01Icon} strokeWidth={2} className="size-4" />
          </Button>
        </div>
      </div>
      {images.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {images.map((img, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                idx === currentIndex ? 'border-primary' : 'border-transparent'
              }`}
            >
              <Image
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setIsFullscreen(false)}>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-4 top-4 bg-background/20 text-white hover:bg-background/40"
            onClick={() => setIsFullscreen(false)}
          >
            <HugeiconsIcon icon={MultiplicationSignIcon} strokeWidth={2} className="size-4" />
          </Button>
          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/20 text-white hover:bg-background/40"
                onClick={(e) => { e.stopPropagation(); goToPrevious() }}
              >
                <HugeiconsIcon icon={ChevronLeftIcon} strokeWidth={2} className="size-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/20 text-white hover:bg-background/40"
                onClick={(e) => { e.stopPropagation(); goToNext() }}
              >
                <HugeiconsIcon icon={ChevronRightIcon} strokeWidth={2} className="size-4" />
              </Button>
            </>
          )}
          <div className="relative flex-1 h-full">
            <Image
              src={images[currentIndex]}
              alt={`${alt} - fullscreen`}
              fill
              className="object-contain"
              sizes="90vw"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  )
}
