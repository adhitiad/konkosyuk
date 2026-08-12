'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { HugeiconsIcon } from '@hugeicons/react'
import { AlertCircleIcon, StarIcon } from '@hugeicons/core-free-icons'
import { reviewType } from '@/db/schema'
import { apiClient } from '@/lib/axios'

interface ReviewFormProps {
  bookingId: string
  type: typeof reviewType[number]
  targetId: string
  targetName: string
  onSuccess?: () => void
}

function StarRating({
  rating,
  onRatingChange,
}: {
  rating: number
  onRatingChange: (rating: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="transition-colors"
        >
          <HugeiconsIcon
            icon={StarIcon}
            strokeWidth={2}
            className={`size-6 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewForm({
  bookingId,
  type,
  targetId,
  targetName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (rating === 0) {
      setError('Pilih rating terlebih dahulu')
      return
    }

    if (!comment.trim()) {
      setError('Tulis komentar terlebih dahulu')
      return
    }

    setLoading(true)
    try {
      const body: Record<string, unknown> = {
        type,
        rating,
        comment: comment.trim(),
        bookingId,
      }

      if (type === 'tenant') {
        body.reviewedUserId = targetId
      } else {
        body.propertyId = targetId
      }

      const res = await apiClient.post('/api/reviews', body)
      const json = res.data
      if (res.status >= 400) {
        throw new Error(json.error || 'Gagal mengirim review')
      }

      setSuccess(true)
      setRating(0)
      setComment('')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={AlertCircleIcon} strokeWidth={2} className="size-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default">
          <AlertTitle>Berhasil</AlertTitle>
          <AlertDescription>
            Review untuk {targetName} berhasil dikirim
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating rating={rating} onRatingChange={setRating} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Komentar</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Bagaimana pengalaman Anda dengan ${targetName}?`}
          rows={4}
          maxLength={1000}
          required
        />
        <p className="text-xs text-muted-foreground">
          {comment.length}/1000 karakter
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Mengirim...' : 'Kirim Review'}
      </Button>
    </form>
  )
}