"use client"

import { useState } from "react"
import { useSession } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { csrfFetch } from "@/lib/axios"

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

export function PushNotificationToggle() {
  const { data: session } = useSession()
  const [state, setState] = useState<"idle" | "loading" | "enabled" | "error">("idle")

  async function enablePush() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!session || !publicKey || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("error")
      return
    }

    setState("loading")
    try {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") throw new Error("Notification permission was not granted")

      const registration = await navigator.serviceWorker.register("/sw.js")
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = subscription.toJSON()
      const response = await csrfFetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          p256dh: json.keys?.p256dh,
          auth: json.keys?.auth,
        }),
      })
      if (!response.ok) throw new Error("Subscription failed")
      setState("enabled")
    } catch (error) {
      console.error("Push notification setup failed:", error)
      setState("error")
    }
  }

  if (!session || state === "enabled") return null

  return (
    <Button variant="outline" size="sm" onClick={enablePush} disabled={state === "loading"}>
      {state === "loading" ? "Mengaktifkan..." : state === "error" ? "Coba aktifkan lagi" : "Aktifkan notifikasi"}
    </Button>
  )
}
