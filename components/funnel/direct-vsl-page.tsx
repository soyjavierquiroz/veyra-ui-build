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

  return (
    <main className="min-h-dvh bg-[#08030d] px-4 py-8 text-white sm:py-12">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
          Mujer, No Le Escribas
        </p>
        <h1 className="font-serif text-3xl leading-tight text-white sm:text-4xl">
          Antes de escribirle, mira este mensaje.
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/70">
          Janny quiere mostrarte qué hacer cuando el impulso toma el control.
        </p>

        <div className="mt-7 w-full">
          <VslVideoPlayer
            src={funnelConfig.vslVideoUrl}
            title="Mensaje de Janny"
            autoPlay
            blockUserInteraction
            onStarted={handleStarted}
            onEnded={handleCompleted}
          />
        </div>

        <button
          type="button"
          onClick={() => goToDirectOffer(hasCompleted)}
          className={`mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-gold px-6 py-4 text-sm font-bold uppercase tracking-wide text-[#16091e] shadow-xl shadow-gold/20 transition-all hover:brightness-110 active:scale-[0.98] ${
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
    </main>
  )
}
