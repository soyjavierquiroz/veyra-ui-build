"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const PROGRESS_CAP_BEFORE_END = 98
const FALLBACK_DURATION_SECONDS = 240

type UseDummyVslProgressOptions = {
  durationSeconds?: number | null
}

type PandaProgressInput = {
  elapsedSeconds: number
  durationSeconds?: number | null
  isEnded: boolean
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function getResolvedDuration(durationSeconds?: number | null) {
  return Number.isFinite(durationSeconds) &&
    durationSeconds !== null &&
    durationSeconds !== undefined &&
    durationSeconds > 0
    ? durationSeconds
    : FALLBACK_DURATION_SECONDS
}

function getFirstThirdTime(durationSeconds?: number | null) {
  const duration = getResolvedDuration(durationSeconds)
  const firstMilestoneTime = Math.min(20, duration * 0.22)

  return Math.max(duration / 3, firstMilestoneTime + 1)
}

function getPandaLikeProgress({
  elapsedSeconds,
  durationSeconds,
  isEnded,
}: PandaProgressInput): number {
  if (isEnded) return 100

  const duration = getResolvedDuration(durationSeconds)
  const firstMilestoneTime = Math.min(20, duration * 0.22)
  const firstThirdTime = getFirstThirdTime(duration)
  const secondMilestoneTime = duration * 0.62
  const thirdMilestoneTime = duration * 0.84
  const nearEndTime = duration * 0.96

  if (elapsedSeconds <= firstMilestoneTime) {
    return (elapsedSeconds / firstMilestoneTime) * 20
  }

  if (elapsedSeconds <= firstThirdTime) {
    return (
      20 +
      ((elapsedSeconds - firstMilestoneTime) /
        Math.max(1, firstThirdTime - firstMilestoneTime)) *
        30
    )
  }

  if (elapsedSeconds <= secondMilestoneTime) {
    const t =
      (elapsedSeconds - firstThirdTime) /
      Math.max(1, secondMilestoneTime - firstThirdTime)
    const eased = 1 - Math.pow(1 - clamp01(t), 2)

    return 50 + eased * 25
  }

  if (elapsedSeconds <= thirdMilestoneTime) {
    const t =
      (elapsedSeconds - secondMilestoneTime) /
      Math.max(1, thirdMilestoneTime - secondMilestoneTime)
    const eased = 1 - Math.pow(1 - clamp01(t), 2)

    return 75 + eased * 15
  }

  if (elapsedSeconds <= nearEndTime) {
    const t =
      (elapsedSeconds - thirdMilestoneTime) /
      Math.max(1, nearEndTime - thirdMilestoneTime)
    const eased = 1 - Math.pow(1 - clamp01(t), 3)

    return 90 + eased * 8
  }

  return PROGRESS_CAP_BEFORE_END
}

export function useDummyVslProgress(options?: UseDummyVslProgressOptions) {
  const optionDurationSeconds = options?.durationSeconds ?? null
  const startedAtRef = useRef<number | null>(null)
  const progressRef = useRef(0)
  const durationRef = useRef<number | null>(optionDurationSeconds)
  const endedRef = useRef(false)
  const rafRef = useRef<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(
    optionDurationSeconds,
  )

  const setKnownDuration = useCallback((nextDurationSeconds: number) => {
    if (!Number.isFinite(nextDurationSeconds) || nextDurationSeconds <= 0) {
      return
    }

    durationRef.current = nextDurationSeconds
    setDurationSeconds(nextDurationSeconds)
  }, [])

  useEffect(() => {
    if (optionDurationSeconds !== null) {
      setKnownDuration(optionDurationSeconds)
    }
  }, [optionDurationSeconds, setKnownDuration])

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
        getPandaLikeProgress({
          elapsedSeconds: nextElapsedSeconds,
          durationSeconds: durationRef.current,
          isEnded: endedRef.current,
        }),
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
    durationSeconds,
    firstThirdTime: getFirstThirdTime(durationSeconds),
    complete,
    setKnownDuration,
  }
}
