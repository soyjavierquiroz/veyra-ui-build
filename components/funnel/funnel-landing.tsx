"use client"

export function FunnelLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="entry-scene absolute inset-0 z-20 flex h-full w-full items-stretch justify-center overflow-hidden px-4 py-4 text-center">
      <div className="entry-ambient absolute inset-0" />
      <div className="entry-depth absolute inset-0" />
      <div className="entry-sparks absolute inset-0" />

      <div className="entry-content animate-float-up relative z-10 flex h-full w-full max-w-[390px] flex-col items-center justify-between gap-3 py-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex w-full shrink-0 flex-col items-center pt-1">
          <h1 className="entry-title font-sans text-[2.18rem] font-black uppercase leading-[0.88] text-foreground min-[390px]:text-[2.45rem]">
            <span>NO VUELVAS</span>
            <span>AL CHAT DESDE</span>
            <span>LA HERIDA.</span>
          </h1>
        </div>

        <div className="entry-portal-wrap relative my-1 flex w-full flex-1 items-center justify-center">
          <div className="entry-portal-shadow absolute" />
          <div className="entry-portal-aura absolute" />
          <div className="entry-portal absolute">
            <div className="entry-portal-light" />
            <div className="entry-portal-threshold" />
          </div>
          <div className="entry-portal-floor absolute" />
        </div>

        <div className="flex w-full shrink-0 flex-col items-center">
          <p className="entry-subcopy max-w-[19rem] font-serif text-[1.12rem] leading-[1.18] text-foreground/90 min-[390px]:text-[1.22rem]">
            Entra a una experiencia emocional
            <br />
            y descubre qué patrón se activó en ti
            <br />
            antes de escribirle.
          </p>

          <button
            type="button"
            onClick={onStart}
            className="entry-cta mt-4 w-full max-w-[21rem] rounded-full px-5 py-4 font-sans text-sm font-black uppercase text-[#211107] transition duration-200 active:scale-[0.985]"
          >
            ENTRAR A LA EXPERIENCIA
          </button>

          <p className="mt-3 font-sans text-[0.72rem] font-medium text-gold/82">
            Sube el volumen · Toma menos de 3 minutos
          </p>
        </div>
      </div>
    </div>
  )
}
