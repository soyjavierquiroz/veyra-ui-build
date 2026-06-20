"use client"

import { Component, type ErrorInfo, type ReactNode, useEffect } from "react"

type ClarityWindow = Window & {
  clarity?: (...args: unknown[]) => void
}

type FunnelErrorBoundaryProps = {
  children: ReactNode
}

type FunnelErrorBoundaryState = {
  hasError: boolean
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error

  try {
    return JSON.stringify(error)
  } catch {
    return "Unknown client error"
  }
}

export function reportFunnelClientError(
  source: string,
  error: unknown,
  extra: Record<string, unknown> = {},
) {
  const message = getErrorMessage(error)
  const payload = {
    source,
    message,
    ...extra,
  }

  console.debug("[funnel:error]", payload)

  if (typeof window === "undefined") return

  const clarity = (window as ClarityWindow).clarity
  if (typeof clarity !== "function") return

  try {
    clarity("event", `mnle_${source}`)
    clarity("set", "mnle_last_error_source", source)
    clarity("set", "mnle_last_error_message", message.slice(0, 240))
  } catch {
    // Error reporting must never create a second client error.
  }
}

export function FunnelRuntimeErrorCapture() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      reportFunnelClientError("window_error", event.error ?? event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportFunnelClientError("unhandled_rejection", event.reason)
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [])

  return null
}

export class FunnelErrorBoundary extends Component<
  FunnelErrorBoundaryProps,
  FunnelErrorBoundaryState
> {
  state: FunnelErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError(): FunnelErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    reportFunnelClientError("react_error_boundary", error, {
      componentStack: errorInfo.componentStack,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen w-full items-center justify-center bg-mystic px-5 text-center text-foreground">
          <div className="w-full max-w-sm rounded-[8px] border border-gold/25 bg-black/45 p-6 shadow-[0_0_38px_oklch(0.62_0.18_300/.22)] backdrop-blur">
            <p className="font-serif text-2xl leading-tight text-gold">
              Veyra necesita reiniciar la lectura.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#f5eedc]/84">
              Hubo un fallo momentáneo en esta sesión. Tus datos de pago no se
              tocaron.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 min-h-12 w-full rounded-full border border-gold/65 bg-gold px-5 py-3 text-sm font-bold uppercase tracking-[0.14em] text-background transition-transform active:scale-95"
            >
              Reiniciar lectura
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
