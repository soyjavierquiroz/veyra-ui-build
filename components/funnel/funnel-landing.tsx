"use client"

export function FunnelLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex min-h-screen w-full items-center justify-center px-6 text-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px]" />
      <div className="animate-float-up relative flex max-w-sm flex-col items-center">
        <p className="font-sans text-sm uppercase tracking-[0.28em] text-foreground/85">
          Hay una señal emocional activa.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="glow-violet mt-10 rounded-full bg-primary px-7 py-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-transform active:scale-95"
        >
          Llamada entrante… VEYRA
        </button>
      </div>
    </div>
  )
}
