"use client"

import { useCallback, useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"
import { publicAssetPath } from "./asset-version"

const PORTAL_IMAGE_SRC = publicAssetPath("images", "portal.webp")
const LOADING_COPY = "Veyra está abriendo tu lectura..."

export function FunnelLanding({ onStart }: { onStart: () => void }) {
  const startLockedRef = useRef(false)
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = useCallback(() => {
    if (startLockedRef.current) return

    startLockedRef.current = true
    setIsStarting(true)
    window.setTimeout(onStart, 220)
  }, [onStart])

  return (
    <div className="entry-scene absolute inset-0 z-20 flex h-full w-full items-stretch justify-center overflow-hidden px-4 py-4 text-center">
      <img
        src={PORTAL_IMAGE_SRC}
        alt=""
        aria-hidden="true"
        className="entry-portal-photo absolute inset-0 h-full w-full object-cover"
      />
      <div className="entry-photo-grade absolute inset-0" />
      <div className="entry-ambient absolute inset-0" />
      <div className="entry-depth absolute inset-0" />
      <div className="entry-sparks absolute inset-0" />
      <div className="entry-veil absolute inset-0" />

      <div className="entry-content animate-float-up relative z-10 flex h-full w-full max-w-[390px] flex-col items-center justify-between gap-3 py-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex w-full shrink-0 flex-col items-center pt-1">
          <h1 className="entry-title font-sans text-[2.18rem] font-black leading-[0.88] text-foreground min-[390px]:text-[2.45rem]">
            <span>No vuelvas</span>
            <span>al chat desde</span>
            <span>la herida.</span>
          </h1>
        </div>

        <div className="entry-image-stage w-full flex-1" aria-hidden="true" />

        <div className="flex w-full shrink-0 flex-col items-center">
          <p className="entry-subcopy max-w-[19rem] font-serif text-[1.12rem] leading-[1.18] text-foreground/90 min-[390px]:text-[1.22rem]">
            Descubre en 2 minutos qué emoción está intentando tomar el control
            antes de enviar ese mensaje.
          </p>

          <button
            type="button"
            onClick={handleStart}
            disabled={isStarting}
            aria-busy={isStarting}
            className="entry-cta mt-4 flex min-h-14 w-full max-w-[21rem] items-center justify-center gap-2 rounded-full px-5 py-4 font-sans text-sm font-black text-[#211107] transition duration-200 active:scale-[0.985] disabled:cursor-wait disabled:opacity-90"
          >
            {isStarting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span>{LOADING_COPY}</span>
              </>
            ) : (
              "Empezar mi lectura"
            )}
          </button>

          <p className="mt-3 font-sans text-[0.72rem] font-medium text-gold/82">
            Lectura privada. No necesitas registrarte para empezar.
          </p>
        </div>
      </div>
    </div>
  )
}
