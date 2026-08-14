"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Heart, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitFeedbackAction, type SubmitFeedbackState } from "@/actions/feedback";
import { useActionState } from "react";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <span className="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Sending...
        </>
      ) : (
        "Send Feedback"
      )}
    </Button>
  );
}

export function BetaFeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(submitFeedbackAction, undefined);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110"
        aria-label="Beta Feedback"
      >
        <Heart className="size-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Beta Feedback</DialogTitle>
                <DialogDescription>
                  Help us improve KonkosYuk by sharing your feedback.
                </DialogDescription>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-1 hover:bg-muted"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
          </DialogHeader>

          <form action={formAction} className="space-y-4">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">
                Category
              </label>
              <select
                id="category"
                name="category"
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                required
              >
                <option value="bug">Bug Report</option>
                <option value="feature">Feature Request</option>
                <option value="improvement">Improvement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-1 block text-sm font-medium">
                Message
              </label>
              <Textarea
                id="message"
                name="message"
                placeholder="Tell us what you think..."
                rows={4}
                required
              />
            </div>

            {state?.error && (
              <p className="text-sm text-red-500">{state.error}</p>
            )}

            {state?.success && (
              <p className="text-sm text-green-600">Thank you for your feedback!</p>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <SubmitButton />
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
