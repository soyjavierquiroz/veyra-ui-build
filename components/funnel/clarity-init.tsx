"use client"

import { useEffect } from "react"
import { initMicrosoftClarity } from "./lib/clarity"

export function ClarityInit() {
  useEffect(() => {
    initMicrosoftClarity(
      process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID || "x4tqk0ij4s",
    )
  }, [])

  return null
}
