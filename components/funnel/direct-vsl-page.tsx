"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight } from "lucide-react"
import { funnelConfig } from "./config"
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
  const startedRef = useRef(false)
  const completedRef = useRef(false)

  useEffect(() => {
    initFunnelMetaPixel()
    persistFunnelContext({ sid: getOrCreateFunnelSid() })
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
    <main className="min-h-dvh bg-[radial-gradient(circle_at_50%_18%,#251130_0%,#08030d_48%)] px-4 pb-32 pt-4 text-white sm:py-10 md:pb-10">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-gold sm:text-xs">
          Mujer, No Le Escribas
        </p>
        <h1 className="font-serif text-[1.65rem] leading-[1.08] text-white sm:text-4xl">
          <span className="block">No le escribas todavía.</span>
          <span className="block">Mira esto antes de volver al chat.</span>
        </h1>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/70 sm:text-sm">
          Janny te muestra qué hacer cuando el impulso toma el control.
        </p>

        <div className="mt-4 aspect-[3/4] w-full max-w-[300px] overflow-hidden rounded-[1.6rem] border border-gold/30 bg-black shadow-[0_22px_70px_rgba(109,55,139,0.35)] sm:max-w-[340px]">
          <VslVideoPlayer
            src={funnelConfig.directVslVideoUrl}
            title="Mensaje de Janny"
            autoPlay
            blockUserInteraction
            fullScreen
            className="rounded-[1.6rem]"
            onStarted={handleStarted}
            onEnded={handleCompleted}
          />
        </div>

        <button
          type="button"
          onClick={goToOffer}
          className={`mt-4 flex w-full max-w-[340px] items-center justify-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-[#16091e] shadow-xl shadow-gold/20 transition-all hover:brightness-110 active:scale-[0.98] ${
            hasStarted ? "opacity-100" : "opacity-90"
          }`}
        >
          Ver el reto Mujer, No Le Escribas
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <p className="mt-3 text-xs text-white/50">
          Accede al reto guiado de 7 días para volver a ti.
        </p>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-white/10 bg-[#08030d]/95 px-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-18px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl md:hidden">
        <div className="mx-auto w-full max-w-md">
          <button
            type="button"
            onClick={goToOffer}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gold px-5 py-3 text-sm font-extrabold tracking-[0.08em] text-[#16091e] shadow-lg shadow-gold/20 active:scale-[0.98]"
          >
            VER EL RETO AHORA
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="mt-1.5 text-center text-[10px] leading-tight text-white/55">
            Accede al reto guiado de 7 días para volver a ti.
          </p>
        </div>
      </div>
    </main>
  )
}
