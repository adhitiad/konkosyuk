"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { replySchema } from "@/lib/validations/reviews";

interface OwnerReplyFormProps {
  reviewId: string;
  onSubmit: (content: string) => Promise<void>;
  onCancel?: () => void;
}

export function OwnerReplyForm({
  reviewId,
  onSubmit,
  onCancel,
}: OwnerReplyFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = replySchema.parse({ content });
      setIsSubmitting(true);
      await onSubmit(data.content);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Terjadi kesalahan saat mengirim balasan");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Balasan</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis balasan Anda..."
          rows={3}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {content.length}/1000 karakter
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "Mengirim..." : "Kirim Balasan"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
