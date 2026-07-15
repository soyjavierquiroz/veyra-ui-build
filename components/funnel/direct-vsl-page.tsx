"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { directVslCtaDelaySeconds, funnelConfig } from "./config"
import {
  getOrCreateFunnelSid,
  isAdsPath,
  persistFunnelContext,
} from "./funnel-handoff"
import { initFunnelMetaPixel, trackFunnelCustomEvent } from "./lib/meta-pixel"
import { VslVideoPlayer } from "./video-player/vsl-video-player"

const OFFER_ORIGIN =
  process.env.NEXT_PUBLIC_OFFER_ORIGIN?.trim() ||
  "https://reconociendotupoder.com"

const PASSTHROUGH_KEYS = new Set([
  "fbclid",
  "fbc",
  "fbp",
  "ttclid",
  "gclid",
  "debug_tracking",
  "from_funnel",
  "funnel_slug",
  "sid",
  "pattern",
  "entry_path",
  "handoff_path",
  "tracking_mode",
  "source_path",
])

function readCookie(name: string): string {
  const prefix = `${name}=`
  const item = document.cookie.split("; ").find((part) => part.startsWith(prefix))
  if (!item) return ""
  try {
    return decodeURIComponent(item.slice(prefix.length))
  } catch {
    return ""
  }
}

function goToDirectOffer(vslCompleted: boolean): void {
  const current = new URL(window.location.href)
  const ads = isAdsPath(current.pathname)
  const offerPath = ads ? "/x9m/o/no-le-escribas" : "/o/no-le-escribas"
  const target = new URL(offerPath, OFFER_ORIGIN)
  const sid = current.searchParams.get("sid") || getOrCreateFunnelSid()

  current.searchParams.forEach((value, key) => {
    if (PASSTHROUGH_KEYS.has(key) || key.toLowerCase().startsWith("utm_")) {
      target.searchParams.set(key, value)
    }
  })

  const fbc = current.searchParams.get("fbc") || readCookie("_fbc")
  const fbp = current.searchParams.get("fbp") || readCookie("_fbp")
  if (fbc) target.searchParams.set("fbc", fbc)
  if (fbp) target.searchParams.set("fbp", fbp)

  target.searchParams.set("from_funnel", "mnle-direct-vsl")
  target.searchParams.set("funnel_slug", "mnle")
  target.searchParams.set("sid", sid)
  target.searchParams.set("vsl_completed", vslCompleted ? "1" : "0")
  target.searchParams.set("tracking_mode", ads ? "ads" : "organic")
  target.searchParams.set("entry_path", current.pathname)
  target.searchParams.set("source_path", `${current.pathname}${current.search}`)
  target.searchParams.set("handoff_path", offerPath)

  persistFunnelContext({ sid, vslStarted: true, vslCompleted })
  window.location.assign(target.toString())
}

export function DirectVslPage() {
  const [hasStarted, setHasStarted] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [showCta, setShowCta] = useState(false)
  const startedRef = useRef(false)
  const completedRef = useRef(false)

  useEffect(() => {
    initFunnelMetaPixel()
    persistFunnelContext({ sid: getOrCreateFunnelSid() })
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(
      () => setShowCta(true),
      directVslCtaDelaySeconds * 1000,
    )
    return () => window.clearTimeout(timer)
  }, [])

  const handleStarted = useCallback(() => {
    setHasStarted(true)
    if (startedRef.current) return
    startedRef.current = true
    trackFunnelCustomEvent("VSLStarted", { funnel_variant: "direct-vsl" })
    persistFunnelContext({ vslStarted: true })
  }, [])

  const handleCompleted = useCallback(() => {
    setHasCompleted(true)
    if (completedRef.current) return
    completedRef.current = true
    trackFunnelCustomEvent("VSLCompleted", { funnel_variant: "direct-vsl" })
    persistFunnelContext({ vslStarted: true, vslCompleted: true })
  }, [])

  const goToOffer = useCallback(() => {
    goToDirectOffer(hasCompleted)
  }, [hasCompleted])

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_50%_18%,#251130_0%,#08030d_48%)] px-4 pb-28 pt-3 text-white sm:py-10 md:pb-10">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-gold sm:text-xs">
          Mujer, No Le Escribas
        </p>
        <h1 className="font-serif text-base font-semibold uppercase leading-none text-white min-[360px]:text-xl sm:text-3xl">
          <span className="block whitespace-nowrap">Si le escribes ahora,</span>
          <span className="block whitespace-nowrap">no vas a decir lo que sientes.</span>
        </h1>
        <p className="mt-1.5 max-w-sm text-xs font-medium leading-relaxed text-white/75 sm:text-sm">
          Vas a escribir desde la herida que él activó.
        </p>

        <div className="relative mt-2.5 h-[min(70vh,calc((100vw-48px)*1.42+20px))] w-[calc(100vw-48px)] max-w-[500px] overflow-hidden rounded-[1.75rem] border border-gold/30 bg-black shadow-[0_22px_70px_rgba(109,55,139,0.35)] md:aspect-[3/4] md:h-auto">
          <VslVideoPlayer
            src={funnelConfig.directVslVideoUrl}
            title="Mensaje de Janny"
            autoPlay
            blockUserInteraction
            startMuted
            showSoundOverlay
            videoFit="cover"
            videoScale={1.12}
            fullScreen
            className="rounded-[1.6rem]"
            onStarted={handleStarted}
            onEnded={handleCompleted}
          />
        </div>

        {showCta ? (
          <>
            <button
              type="button"
              onClick={goToOffer}
              className={`mt-5 hidden w-full max-w-[420px] items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#16091e] shadow-xl shadow-gold/20 transition-all hover:brightness-110 active:scale-[0.98] md:flex ${
                hasStarted ? "opacity-100" : "opacity-90"
              }`}
            >
              VER EL RETO AHORA
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </>
        ) : null}
      </div>

      {showCta ? (
        <div className="fixed inset-x-0 bottom-0 z-[70] bg-gradient-to-t from-[#08030d] via-[#08030d]/96 to-transparent px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-3 shadow-[0_-14px_36px_rgba(0,0,0,0.32)] md:hidden">
          <div className="mx-auto w-full max-w-md">
            <button
              type="button"
              onClick={goToOffer}
              className="flex min-h-16 w-full flex-col items-center justify-center rounded-[1.35rem] bg-gold px-5 py-2.5 text-[#16091e] shadow-lg shadow-gold/20 active:scale-[0.98]"
            >
              <span className="flex items-center gap-1.5 text-[15px] font-black tracking-[0.12em]">
                VER EL RETO AHORA
                <ArrowRight className="size-4" aria-hidden="true" />
              </span>
              <span className="mt-0.5 block text-[10px] font-medium tracking-normal opacity-75">
                Reto guiado de 7 días para volver a ti
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </main>
  )
}
