const CLARITY_SCRIPT_ID = "microsoft-clarity-script"

type ClarityQueue = {
  (...args: unknown[]): void
  q?: unknown[][]
}

declare global {
  interface Window {
    clarity?: ClarityQueue
  }
}

export function initMicrosoftClarity(projectId?: string): void {
  if (typeof window === "undefined") return

  const id = projectId?.trim()
  if (!id) return

  if (document.getElementById(CLARITY_SCRIPT_ID)) return

  window.clarity =
    window.clarity ||
    ((...args: unknown[]) => {
      window.clarity!.q = window.clarity!.q || []
      window.clarity!.q.push(args)
    })

  const script = document.createElement("script")
  script.id = CLARITY_SCRIPT_ID
  script.async = true
  script.src = `https://www.clarity.ms/tag/${id}`

  document.head.appendChild(script)
}
