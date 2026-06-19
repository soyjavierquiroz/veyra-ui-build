"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const PROGRESS_CAP_BEFORE_END = 98

function getDummyProgress(elapsedSeconds: number, isEnded: boolean): number {
  if (isEnded) return 100

  if (elapsedSeconds <= 10) {
    return (elapsedSeconds / 10) * 10
  }

  if (elapsedSeconds <= 30) {
    return 10 + ((elapsedSeconds - 10) / 20) * 10
  }

  if (elapsedSeconds <= 60) {
    return 20 + ((elapsedSeconds - 30) / 30) * 30
  }

  if (elapsedSeconds <= 120) {
    return 50 + ((elapsedSeconds - 60) / 60) * 20
  }

  if (elapsedSeconds <= 240) {
    return 70 + ((elapsedSeconds - 120) / 120) * 15
  }

  if (elapsedSeconds <= 420) {
    return 85 + ((elapsedSeconds - 240) / 180) * 9
  }

  const slowTail =
    94 + Math.min(4, Math.log1p((elapsedSeconds - 420) / 60) * 1.1)

  return Math.min(PROGRESS_CAP_BEFORE_END, slowTail)
}

export function useDummyVslProgress() {
  const startedAtRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const endedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  const complete = useCallback(() => {
    endedRef.current = true
    progressRef.current = 100

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }

    setProgress(100)
  }, [])

  useEffect(() => {
    startedAtRef.current = performance.now()

    const tick = (now: number) => {
      const startedAt = startedAtRef.current ?? now
      const nextElapsedSeconds = Math.max(0, (now - startedAt) / 1000)
      const nextProgress = Math.max(
        progressRef.current,
        getDummyProgress(nextElapsedSeconds, endedRef.current),
      )

      progressRef.current = nextProgress
      setElapsedSeconds(nextElapsedSeconds)
      setProgress(nextProgress)

      if (!endedRef.current) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [])

  return {
    progress,
    elapsedSeconds,
    complete,
  }
}
