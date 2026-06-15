"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react"

export type ResultMp4PlayerHandle = {
  preload: () => void
  playWithSound: () => Promise<void>
  pause: () => void
  stop: () => void
  reset: () => void
  isReady: () => boolean
}

export type ResultMp4PlayerProps = {
  src: string
  visible: boolean
  autoPreload?: boolean
  objectFit?: "cover" | "contain"
  revealRequested?: boolean
  introVeilActive?: boolean
  introVeilDurationMs?: number
  introVeilFadeMs?: number
  className?: string
  onReadyToReveal?: () => void
  onPlaying?: () => void
  onEnded?: () => void
  onPlaybackFailed?: () => void
}

export const ResultMp4Player = forwardRef<
  ResultMp4PlayerHandle,
  ResultMp4PlayerProps
>(function ResultMp4Player(
  {
    src,
    visible,
    autoPreload = true,
    objectFit = "cover",
    revealRequested: _revealRequested,
    introVeilActive: _introVeilActive,
    introVeilDurationMs: _introVeilDurationMs,
    introVeilFadeMs: _introVeilFadeMs,
    className = "",
    onReadyToReveal,
    onPlaying,
    onEnded,
    onPlaybackFailed,
  },
  ref,
) {
  void _revealRequested
  void _introVeilActive
  void _introVeilDurationMs
  void _introVeilFadeMs

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const readyRef = useRef(false)
  const endedRef = useRef(false)
  const onReadyToRevealRef = useRef(onReadyToReveal)
  const onPlayingRef = useRef(onPlaying)
  const onEndedRef = useRef(onEnded)
  const onPlaybackFailedRef = useRef(onPlaybackFailed)
  const [, setReadyTick] = useState(0)

  useEffect(() => {
    onReadyToRevealRef.current = onReadyToReveal
    onPlayingRef.current = onPlaying
    onEndedRef.current = onEnded
    onPlaybackFailedRef.current = onPlaybackFailed
  }, [onEnded, onPlaybackFailed, onPlaying, onReadyToReveal])

  const markReady = useCallback(() => {
    if (readyRef.current) return

    readyRef.current = true
    setReadyTick((tick) => tick + 1)
    onReadyToRevealRef.current?.()
  }, [])

  const markEnded = useCallback(() => {
    if (endedRef.current) return

    endedRef.current = true
    onEndedRef.current?.()
  }, [])

  const reset = useCallback(() => {
    const video = videoRef.current
    endedRef.current = false

    if (!video) return

    try {
      video.pause()
      video.currentTime = 0
    } catch {
      // Best-effort media cleanup only.
    }
  }, [])

  const preload = useCallback(() => {
    const video = videoRef.current
    if (!video || !src) return

    try {
      video.preload = "auto"
      video.load()
    } catch {
      // Loading is opportunistic; UI remains on the mystic veil if it fails.
    }
  }, [src])

  useEffect(() => {
    readyRef.current = false
    endedRef.current = false
    setReadyTick((tick) => tick + 1)

    if (autoPreload) {
      window.requestAnimationFrame(preload)
    }
  }, [autoPreload, preload, src])

  useImperativeHandle(
    ref,
    () => ({
      preload,
      playWithSound: async () => {
        const video = videoRef.current
        if (!video) {
          onPlaybackFailedRef.current?.()
          return
        }

        try {
          endedRef.current = false
          video.muted = false
          video.volume = 1
          video.currentTime = 0
          await video.play()
        } catch (error) {
          onPlaybackFailedRef.current?.()
          throw error
        }
      },
      pause: () => {
        videoRef.current?.pause()
      },
      stop: reset,
      reset,
      isReady: () => readyRef.current,
    }),
    [preload, reset],
  )

  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden bg-black transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      } ${className}`}
      aria-hidden={!visible}
    >
      <video
        ref={videoRef}
        src={src}
        preload="auto"
        playsInline
        controls={false}
        muted={false}
        loop={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        className={`absolute inset-0 h-full w-full ${
          objectFit === "contain" ? "object-contain" : "object-cover"
        }`}
        onLoadedMetadata={() => {
          // Metadata is useful for duration, but reveal waits for loadeddata/canplay.
        }}
        onLoadedData={markReady}
        onCanPlay={markReady}
        onCanPlayThrough={markReady}
        onPlaying={() => {
          onPlayingRef.current?.()
        }}
        onEnded={markEnded}
        onError={() => {
          onPlaybackFailedRef.current?.()
        }}
        onStalled={() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[funnel] result MP4 stalled")
          }
        }}
        onWaiting={() => {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[funnel] result MP4 waiting")
          }
        }}
        onTimeUpdate={(event) => {
          const video = event.currentTarget

          if (
            Number.isFinite(video.duration) &&
            video.duration > 0 &&
            video.currentTime >= video.duration - 0.25
          ) {
            markEnded()
          }
        }}
      />
    </div>
  )
})
