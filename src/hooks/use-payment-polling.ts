import { useEffect, useState, useRef, useCallback } from 'react'

interface UsePaymentPollingOptions {
  invoiceNumber: string | null | undefined
  onSuccess?: (payment: Record<string, unknown>) => void
  intervalMs?: number
  maxAttempts?: number
}

interface UsePaymentPollingResult {
  payment: Record<string, unknown> | null
  isLoading: boolean
  isSuccess: boolean
  isTimeout: boolean
  attempt: number
  error: string | null
}

export function usePaymentPolling({
  invoiceNumber,
  onSuccess,
  intervalMs = 5000,
  maxAttempts = 60,
}: UsePaymentPollingOptions): UsePaymentPollingResult {
  const [payment, setPayment] = useState<Record<string, unknown> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isTimeout, setIsTimeout] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess
  const isSuccessRef = useRef(isSuccess)
  isSuccessRef.current = isSuccess
  const isTimeoutRef = useRef(isTimeout)
  isTimeoutRef.current = isTimeout
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    if (!invoiceNumber || isSuccessRef.current || isTimeoutRef.current) return

    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/payments?invoiceNumber=${encodeURIComponent(invoiceNumber)}`)
      if (!res.ok) {
        throw new Error('Failed to fetch payment status')
      }
      const json = await res.json()
      const data = json.data as Record<string, unknown> | undefined

      if (!data) {
        setError('Payment not found')
        return
      }

      setPayment(data)

      if (data.status === 'success') {
        setIsSuccess(true)
        setIsLoading(false)
        onSuccessRef.current?.(data)
        return
      }

      if (data.status === 'failed' || data.status === 'expired') {
        setIsLoading(false)
        setError(`Payment ${data.status}`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Polling failed')
    } finally {
      setIsLoading(false)
    }
  }, [invoiceNumber])

  useEffect(() => {
    if (!invoiceNumber || isSuccess || isTimeout) return

    let currentAttempt = 0

    const startPolling = async () => {
      await poll()
      if (isSuccessRef.current || isTimeoutRef.current) return
      currentAttempt = 1
      setAttempt(1)

      timerRef.current = setInterval(async () => {
        if (isSuccessRef.current || isTimeoutRef.current) {
          if (timerRef.current) clearInterval(timerRef.current)
          return
        }

        currentAttempt += 1
        setAttempt(currentAttempt)

        if (currentAttempt >= maxAttempts) {
          if (timerRef.current) clearInterval(timerRef.current)
          setIsTimeout(true)
          setIsLoading(false)
          return
        }

        poll()
      }, intervalMs)
    }

    startPolling()

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [invoiceNumber, isSuccess, isTimeout, poll, intervalMs, maxAttempts])

  return {
    payment,
    isLoading,
    isSuccess,
    isTimeout,
    attempt,
    error,
  }
}
