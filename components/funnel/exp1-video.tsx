"use client"

import { useEffect, useRef } from "react"

const YT_ID = "CUc-yP8aGiU"
// The first scene plays the background video for this long, then advances.
const SCENE_DURATION = 10_000

export function Exp1Video({ onComplete }: { onComplete: () => void }) {
  const done = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true
        onComplete()
      }
    }, SCENE_DURATION)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Full-screen muted, autoplaying background video (audio comes from the
          persistent track in the orchestrator, so the video stays muted) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          className="absolute left-1/2 top-1/2 h-[100vh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
          src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&controls=0&playsinline=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1&fs=0`}
          title="La consciencia de sanar"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {/* Subtle cinematic vignette only — no text, no buttons */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_70%_at_50%_45%,transparent_35%,oklch(0.05_0.02_295/0.6)_100%)]" />
    </section>
  )
}
