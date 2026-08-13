import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KonkosYuk",
    short_name: "KonkosYuk",
    description: "Booking kost dan kontrakan dengan aman.",
    start_url: "/id",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0f766e",
    orientation: "portrait-primary",
    icons: [
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
