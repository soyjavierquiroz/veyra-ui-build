"use client"

import Link from "next/link"
import Image from "next/image"
import {
  Check,
  ShieldCheck,
  Sparkles,
  Heart,
  Pause,
  Anchor,
  MapPin,
  Repeat,
  Star,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { funnelConfig } from "@/components/funnel/config"
import { rootPublicAsset } from "@/components/funnel/asset-version"
import { trackFunnelEvent } from "@/components/funnel/lib/analytics"
import { Particles } from "@/components/funnel/particles"
import { VeyraOrb } from "@/components/funnel/veyra-orb"

const PRIMARY_HREF = ["/", "whatsapp"].join("")
const JANNY_PORTRAIT_SRC = rootPublicAsset("janny-portrait.png")

function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`mx-auto w-full max-w-md px-5 py-12 ${className}`}>
      {children}
    </section>
  )
}

const APERTURA = [
  "Tienes el celular cerca.",
  "Abres el chat.",
  "Miras si está en línea.",
  "Revisas si vio tu historia.",
  "Entras a su perfil.",
  "Escribes una frase.",
  "La borras.",
  "Vuelves a escribir.",
  "Una parte de ti dice: “no lo hagas”.",
  "Pero otra parte responde: “solo quiero saber si todavía le importo”.",
  "Y ahí empieza la pelea interna.",
  "No quieres perseguir. No quieres rogar. No quieres perder tu dignidad por un mensaje.",
  "No quieres volver a sentir esa caída cuando no responde como esperabas.",
  "Pero no escribirle se siente casi insoportable.",
  "Porque el silencio aprieta. La mente inventa. El cuerpo se acelera.",
  "La nostalgia suaviza lo que dolió. La culpa te dice que tal vez exageraste. Y la ansiedad te empuja a hacer algo rápido.",
  "Aquí es donde necesitas detenerte.",
  "No para castigarte. No para hacerte la fuerte. No para fingir que no te importa.",
  "Sino para mirar algo más profundo: quizá no eres tú queriendo escribir. Quizá es una emoción activa intentando calmarse a través de él.",
]

const VILLANO_QUOTES = [
  "“Solo escríbele una vez.”",
  "“Solo mira si está conectado.”",
  "“Solo necesitas una explicación.”",
  "“Solo dile lo último.”",
  "“Solo busca una señal.”",
  "“Solo confirma si todavía le importas.”",
]

const PAUSA = [
  { letter: "P", icon: Pause, title: "Para el impulso", desc: "No abras el chat todavía." },
  { letter: "A", icon: Anchor, title: "Aterriza lo que sientes", desc: "Nombra lo que estás sintiendo." },
  { letter: "U", icon: MapPin, title: "Ubica la realidad", desc: "Separa hechos de fantasías." },
  { letter: "S", icon: Repeat, title: "Sustituye el mensaje", desc: "Descarga sin enviarlo." },
  { letter: "A", icon: Heart, title: "Acuérdate de ti", desc: "Elige desde calma." },
]

const DIAS = [
  { d: "Día 1", t: "Para el impulso", o: "detener el automático antes de abrir el chat.", b: "Vas a identificar el momento exacto en que la ansiedad intenta tomar el mando." },
  { d: "Día 2", t: "Aterriza lo que sientes", o: "distinguir si lo que aparece es amor, ansiedad, culpa, nostalgia, miedo o necesidad de validación.", b: "Vas a nombrar la emoción real detrás del deseo de escribir." },
  { d: "Día 3", t: "Ubica la realidad", o: "no tomar decisiones desde fantasías, suposiciones o miedo.", b: "Vas a separar lo que realmente pasó de lo que tu mente está imaginando." },
  { d: "Día 4", t: "Mira el patrón", o: "entender qué parte de ti está intentando escribir.", b: "Vas a reconocer si tu impulso nace de abandono, validación, cierre, culpa, nostalgia o ansiedad por silencio." },
  { d: "Día 5", t: "Sustituye el mensaje", o: "darle salida a la emoción sin entregarle el control al chat.", b: "Vas a descargar lo que querías escribir sin enviarlo." },
  { d: "Día 6", t: "Acuérdate de ti", o: "elegirte sin castigarte.", b: "Vas a mirar tu valor, tu calma y tu dignidad antes de decidir." },
  { d: "Día 7", t: "Decide desde calma", o: "no actuar desde herida, sino desde conciencia.", b: "Vas a cerrar el reto con más claridad." },
]

const INCLUDES = [
  "Acceso digital al reto de 7 días.",
  "Recorrido guiado paso a paso.",
  "Método P.A.U.S.A. aplicado al impulso de escribirle.",
  "Ejercicios de claridad emocional.",
  "Prácticas para ansiedad, nostalgia, culpa, miedo y necesidad de respuesta.",
  "Guía para separar hechos de fantasías.",
  "Descarga emocional sin enviar el mensaje.",
  "Material de apoyo tipo kit.",
  "Acceso vía WhatsApp / QR / comprobante.",
  "Garantía de claridad emocional de 7 días.",
]

const TESTIMONIALS = [
  "Sentí que por primera vez alguien no me estaba diciendo ‘no le escribas’ desde juicio, sino ayudándome a entender por qué quería hacerlo.",
  "Me ayudó a frenar antes de actuar y a no castigarme por sentir.",
  "Pensé que necesitaba una respuesta de él, pero empecé a ver que necesitaba volver a mí.",
]

const FAQ = [
  { q: "¿Para quién es este reto?", a: "Es para mujeres que están intentando no escribirle a alguien, pero sienten ansiedad, nostalgia, culpa, miedo al abandono, necesidad de cierre o deseo de validación. También es para ti si ya intentaste contacto cero, pero te cuesta sostenerlo emocionalmente." },
  { q: "¿Para quién no es?", a: "No es para ti si buscas una fórmula para manipular a alguien, hacer que vuelva o controlar sus respuestas. Tampoco es para ti si necesitas atención psicológica urgente o estás atravesando una crisis emocional intensa que requiere ayuda profesional inmediata." },
  { q: "¿Qué pasa si ya le escribí?", a: "Puedes hacerlo igual. El reto no está diseñado solo para evitar un mensaje. Está diseñado para ayudarte a entender qué se activó antes, durante o después de escribir. No se trata de castigarte. Se trata de volver a ti desde donde estés." },
  { q: "¿Qué pasa si rompo contacto cero durante el reto?", a: "No quedas fuera. No fallaste como mujer. No pierdes tu proceso. El reto te ayuda a observar qué pasó, qué emoción tomó el mando y cómo volver a pausar. Una recaída emocional también puede convertirse en información." },
  { q: "¿Esto reemplaza terapia?", a: "No. Este reto no reemplaza terapia, diagnóstico, tratamiento psicológico ni atención profesional. Es una experiencia de claridad emocional y pausa guiada. Si estás atravesando una crisis intensa, pensamientos de hacerte daño o sientes que no puedes sostenerte, busca apoyo profesional o ayuda inmediata en tu zona." },
  { q: "¿Sirve si siento mucha ansiedad?", a: "Sí, si lo que necesitas es una guía inicial para pausar, nombrar lo que sientes y ordenar el impulso antes de actuar. Pero si la ansiedad es intensa, constante o sientes que no puedes sostenerte, busca también apoyo profesional." },
  { q: "¿Qué incluye exactamente?", a: "Incluye un recorrido digital de 7 días basado en el Método P.A.U.S.A., con prácticas para detener el impulso, identificar la emoción activa, separar hechos de fantasías, mirar el patrón, descargar sin enviar y decidir desde más calma. No es solo un PDF. Es un kit guiado para ayudarte a volver a ti antes de escribir desde ansiedad." },
  { q: "¿Cuánto dura?", a: "El reto dura 7 días. Puedes avanzar día por día y volver a los contenidos cuando sientas nuevamente el impulso de escribir." },
  { q: "¿Cómo accedo?", a: "Después de realizar el pago de Bs 69 y enviar tu comprobante por WhatsApp, recibirás el enlace de acceso al reto." },
  { q: "¿Cómo se paga?", a: "El pago se realiza mediante QR. Después de pagar, envías el comprobante por WhatsApp y el equipo valida tu acceso." },
  { q: "¿Qué cubre la garantía?", a: "La garantía cubre la claridad emocional. Si recorres el reto, aplicas las prácticas y sientes que no te ayudó a entender mejor tu impulso o a pausar con más conciencia, puedes escribirnos dentro de los primeros 7 días." },
  { q: "¿Voy a dejar de extrañarlo en 7 días?", a: "No prometemos eso. Extrañar a alguien puede tomar tiempo. Este reto no busca borrarte el dolor. Busca ayudarte a no actuar desde el impulso cada vez que el dolor aparece." },
  { q: "¿Y si mi caso es muy diferente?", a: "Tu historia es única. Pero los patrones emocionales que se activan ante el silencio, la distancia, el abandono, la culpa, la nostalgia o la necesidad de respuesta suelen repetirse. El reto no pretende simplificar tu historia. Pretende darte una estructura para atravesar el impulso con más claridad." },
]

function CtaButton({ children }: { children: React.ReactNode }) {
  return (
    <Link
      href={PRIMARY_HREF}
      onClick={() => trackFunnelEvent("sales_cta_clicked", { href: PRIMARY_HREF })}
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-4 text-center text-sm font-semibold uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
    >
      {children}
    </Link>
  )
}

export function SalesPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-mystic pb-28 text-foreground">
      {/* HERO */}
      <Section className="relative pt-16 text-center">
        <Particles count={20} />
        <div className="relative z-10 flex flex-col items-center">
          <VeyraOrb size={120} active className="mb-6" />
          <h1 className="text-balance font-serif text-3xl leading-tight text-gold">
            Antes de escribirle desde ansiedad, haz una P.A.U.S.A. y vuelve a ti.
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground break-words">
            Reto de 7 días para pausar el impulso, ordenar lo que sientes y recuperar tu centro
            antes de enviar ese mensaje.
          </p>
          <p className="mt-5 font-serif text-lg text-foreground break-words">
            Mujer, No Le Escribas — Reto 7 Días para Volver a Ti
          </p>
          <p className="mt-2 text-sm text-muted-foreground break-words">
            El primer portal del Método P.A.U.S.A. dentro de GranDiosa Mujer. Creado por Janny
            Helguero, fundadora de GranDiosa Mujer, para mujeres que están cansadas de actuar
            desde ansiedad, dolor, nostalgia o necesidad de respuesta.
          </p>
          <div className="mt-8 w-full">
            <CtaButton>Quiero empezar mi P.A.U.S.A.</CtaButton>
          </div>
        </div>
      </Section>

      {/* APERTURA NARRATIVA */}
      <Section>
        <div className="rounded-3xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="space-y-2 leading-relaxed text-foreground/90">
            {APERTURA.map((line, i) => (
              <p key={i} className="break-words">
                {line}
              </p>
            ))}
          </div>
          <div className="mt-6">
            <CtaButton>Necesito hacer una pausa</CtaButton>
          </div>
        </div>
      </Section>

      {/* VILLANO */}
      <Section>
        <h2 className="mb-5 font-serif text-2xl text-gold text-balance">
          El problema no es que seas intensa.
        </h2>
        <div className="space-y-2 leading-relaxed text-foreground/90">
          <p>No es que seas ridícula. No es que no tengas dignidad. No es que ames demasiado. No es que no puedas soltar.</p>
          <p className="font-serif text-lg text-foreground">
            El verdadero villano es más silencioso: la ansiedad disfrazada de amor.
          </p>
          <p>Esa ansiedad que te dice:</p>
        </div>
        <div className="my-5 flex flex-col gap-2">
          {VILLANO_QUOTES.map((q) => (
            <div
              key={q}
              className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground break-words"
            >
              {q}
            </div>
          ))}
        </div>
        <div className="space-y-2 leading-relaxed text-foreground/90">
          <p>Pero después de escribir… no siempre llega la paz. A veces llega más espera. Más interpretación. Más ansiedad. Más culpa. Más ganas de revisar.</p>
          <p>Porque el mensaje no resolvió lo que dolía. Solo lo calmó por unos minutos. Y cuando la calma depende de que alguien responda, tu centro queda en manos de otra persona.</p>
          <p className="font-serif text-base text-gold">
            Este reto nace para ese momento exacto: cuando sabes que escribir puede dolerte más… pero no escribir se siente insoportable.
          </p>
        </div>
      </Section>

      {/* REVELACION */}
      <Section>
        <div className="rounded-3xl border border-gold/30 bg-card/50 p-6 backdrop-blur">
          <h2 className="mb-4 font-serif text-2xl text-gold text-balance">La revelación</h2>
          <div className="space-y-2 leading-relaxed text-foreground/90">
            <p>Tal vez ya intentaste controlar el mensaje. Borraste el chat. Silenciaste historias. Bloqueaste. Desbloqueaste. Hiciste contacto cero. Te distrajiste. Te prometiste: “esta vez no voy a escribir”.</p>
            <p>Y aun así, el impulso volvió. No porque seas débil. No porque no tengas amor propio. No porque estés condenada a repetir.</p>
            <p>Sino porque intentaste controlar la conducta… sin atender la activación emocional que la empujaba.</p>
            <p className="font-serif text-base text-gold">
              Intentaste controlar el mensaje, pero no atendiste la herida que quería enviarlo.
            </p>
            <p>Por eso no basta con resistir. Porque cuando una parte de ti está activada, no decides desde calma. Decides desde miedo. Desde culpa. Desde nostalgia. Desde ansiedad. Desde necesidad de cierre. Desde necesidad de validación. Desde una parte de ti que solo quiere alivio.</p>
            <p>Y esa parte no necesita juicio. Necesita guía. Necesita estructura. Necesita una forma concreta de volver a ti antes de actuar.</p>
          </div>
        </div>
      </Section>

      {/* METODO PAUSA */}
      <Section>
        <h2 className="mb-3 text-center font-serif text-3xl text-gold">El Método P.A.U.S.A.</h2>
        <p className="mb-2 text-center text-sm leading-relaxed text-muted-foreground break-words">
          Janny Helguero creó el Método P.A.U.S.A. para ayudarte a atravesar ese espacio entre el
          impulso y la acción. Ese instante donde todavía puedes elegir.
        </p>
        <p className="mb-6 text-center text-sm text-muted-foreground break-words">
          No es “aguántate”. No es “hazte la indiferente”. No es “bloquéalo y ya”. No es negar lo
          que sientes. No es fingir que no duele.
        </p>
        <div className="flex flex-col gap-3">
          {PAUSA.map((s, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card/50 p-4 backdrop-blur"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-gold/40 font-serif text-2xl text-gold">
                {s.letter}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-foreground break-words">{s.title}</p>
                <p className="text-sm text-muted-foreground break-words">{s.desc}</p>
              </div>
              <s.icon className="ml-auto size-5 shrink-0 text-primary" />
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm leading-relaxed text-foreground/90 break-words">
          Este método no promete que nunca volverás a sentir ansiedad. Promete algo más real:
          ayudarte a no entregarle el control al impulso cada vez que sientes.
        </p>
      </Section>

      {/* COMO FUNCIONA / 7 DIAS */}
      <Section>
        <h2 className="mb-2 font-serif text-2xl text-gold text-balance">
          Cómo funciona — 7 días para volver a ti
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground break-words">
          No necesitas llegar fuerte. No necesitas hacerlo perfecto. No necesitas estar
          “superada”. No necesitas odiarlo. Solo necesitas estar dispuesta a hacer una pausa.
        </p>
        <div className="flex flex-col gap-3">
          {DIAS.map((day) => (
            <div key={day.d} className="rounded-2xl border border-border bg-card/50 p-5 backdrop-blur">
              <div className="mb-2 flex items-baseline gap-2">
                <span className="font-serif text-lg text-gold">{day.d}</span>
                <span className="text-sm font-medium text-foreground break-words">— {day.t}</span>
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 break-words">{day.b}</p>
              <p className="mt-2 text-sm text-muted-foreground break-words">
                <span className="text-foreground/70">Objetivo:</span> {day.o}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center font-serif text-base text-gold break-words">
          El objetivo no es convertirte en piedra. El objetivo es que vuelvas a ti antes de
          volver al chat.
        </p>
      </Section>

      {/* PRUEBA / CONFIANZA */}
      <Section>
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-gold/30 bg-card/50 p-6 text-center backdrop-blur">
          <div className="relative size-28 overflow-hidden rounded-full border border-gold/40 glow-gold">
            <Image src={JANNY_PORTRAIT_SRC} alt="Janny Helguero" fill className="object-cover" />
          </div>
          <div>
            <p className="font-serif text-2xl text-gold">Janny Helguero</p>
            <p className="text-sm text-muted-foreground">Fundadora de GranDiosa Mujer.</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 break-words">
            Más de 25 años acompañando procesos emocionales de mujeres. Janny es la guía real
            detrás de este reto. Veyra abre el portal simbólico. Veyra revela el patrón. Pero
            Janny sostiene el camino humano para ordenar lo que aparece.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground break-words">
            El Método P.A.U.S.A. nace de esa experiencia acompañando a mujeres que no quieren
            seguir repitiendo los mismos ciclos afectivos. No como una teoría fría. No como una
            promesa mágica. No como una fórmula para manipular a nadie. Sino como un camino
            sencillo, humano y aplicable para esos momentos donde una mujer sabe que necesita
            detenerse… pero no sabe cómo.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {TESTIMONIALS.map((t, i) => (
            <figure key={i} className="rounded-2xl border border-border bg-card/40 p-4">
              <div className="mb-2 flex gap-0.5 text-gold">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-gold" />
                ))}
              </div>
              <blockquote className="text-sm leading-relaxed text-foreground/90 break-words">
                “{t}”
              </blockquote>
            </figure>
          ))}
          <p className="text-center text-xs text-muted-foreground break-words">
            Nota: usar únicamente testimonios reales aprobados por GranDiosa Mujer.
          </p>
        </div>
      </Section>

      {/* OFERTA */}
      <Section>
        <div className="rounded-3xl border border-gold/40 bg-card/60 p-6 text-center backdrop-blur glow-gold">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-wide text-gold">
            <Sparkles className="size-3.5" />
            Acceso especial de lanzamiento
          </span>
          <h2 className="mt-4 font-serif text-2xl text-gold text-balance">
            Mujer, No Le Escribas
          </h2>
          <p className="text-sm text-muted-foreground">Reto 7 Días para Volver a Ti</p>
          <p className="mt-1 text-xs text-muted-foreground break-words">
            El primer portal del Método P.A.U.S.A. dentro de GranDiosa Mujer.
          </p>
          <p className="mt-4 text-xs uppercase tracking-wide text-muted-foreground">Por solo</p>
          <p className="font-serif text-5xl text-gold">{funnelConfig.priceLabel}</p>

          <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-4">
            <p className="font-serif text-lg text-foreground">No es solo un PDF</p>
            <p className="text-sm text-muted-foreground break-words">
              Es un kit guiado para volver a ti antes de enviar un mensaje desde ansiedad.
            </p>
          </div>

          <ul className="mt-6 flex flex-col gap-3 text-left">
            {INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-gold" />
                <span className="text-sm leading-relaxed text-foreground/90 break-words">
                  {item}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            <CtaButton>Quiero volver a mí — {funnelConfig.priceLabel}</CtaButton>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              Pago por QR. Acceso confirmado por WhatsApp.
            </p>
          </div>
        </div>
      </Section>

      {/* GARANTIA */}
      <Section>
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card/50 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-8 shrink-0 text-gold" />
            <h2 className="font-serif text-xl text-gold text-balance">
              Garantía de claridad emocional de 7 días
            </h2>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 break-words">
            Si después de entrar, recorrer el contenido y aplicar las prácticas sientes que el
            reto no te ayudó a tener más claridad sobre tu impulso, puedes escribirnos dentro de
            los primeros 7 días.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground break-words">
            Esta garantía no promete olvidar. No promete sanar toda tu historia. No promete que
            él vuelva. No promete que nunca más sentirás ansiedad. Promete algo más real: que
            tendrás una estructura para pausar, mirar lo que se activó y volver a ti con más
            conciencia.
          </p>
        </div>
      </Section>

      {/* FAQ */}
      <Section>
        <h2 className="mb-5 text-center font-serif text-2xl text-gold">Preguntas frecuentes</h2>
        <Accordion className="w-full">
          {FAQ.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="border-border">
              <AccordionTrigger className="text-left text-sm font-medium text-foreground hover:no-underline">
                <span className="break-words pr-2">{item.q}</span>
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground break-words">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>

      {/* CTA FINAL */}
      <Section>
        <div className="rounded-3xl border border-gold/30 bg-card/50 p-6 text-center backdrop-blur">
          <div className="space-y-2 leading-relaxed text-foreground/90">
            <p>Tal vez ahora mismo una parte de ti todavía quiere escribirle. Tal vez estás esperando una señal. Tal vez estás intentando ser fuerte. Tal vez estás cansada de prometerte que esta vez no vas a caer.</p>
            <p>No necesitas castigarte por sentir. Pero sí puedes hacer algo distinto antes de actuar.</p>
            <p className="font-serif text-base text-gold">
              Puedes parar el impulso. Puedes aterrizar lo que sientes. Puedes ubicar la realidad.
              Puedes mirar el patrón. Puedes sustituir el mensaje. Puedes acordarte de ti.
            </p>
            <p>Antes de escribirle desde ansiedad, empieza hoy tu P.A.U.S.A.</p>
          </div>
          <p className="mt-5 font-serif text-lg text-foreground break-words">
            Mujer, No Le Escribas — Reto 7 Días para Volver a Ti
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Acceso especial de lanzamiento:{" "}
            <span className="text-gold">{funnelConfig.priceLabel}</span>
          </p>
          <div className="mt-6">
            <CtaButton>Sí, quiero volver a mí — {funnelConfig.priceLabel}</CtaButton>
          </div>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground break-words">
            Una pausa no borra tu historia. Pero puede cambiar desde dónde decides tu próximo
            paso.
          </p>
        </div>
      </Section>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto w-full max-w-md">
          <CtaButton>
            Quiero empezar mi P.A.U.S.A. — {funnelConfig.priceLabel}
          </CtaButton>
        </div>
      </div>
    </main>
  )
}
