"use client";

import { useRouter } from "@/config";

export default function HomePage() {
  const router = useRouter();
  router.push("/");
}
