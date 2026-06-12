"use client"

import { useSearchParams } from "next/navigation"
import { Exp11WhatsappOp, type OpEntry } from "@/components/funnel/exp11-whatsapp-op"

export function WhatsappOpClient() {
  const params = useSearchParams()
  const entry: OpEntry = params.get("modo") === "duda" ? "doubt" : "buy"
  return (
    <main className="min-h-screen bg-mystic">
      <Exp11WhatsappOp entry={entry} />
    </main>
  )
}
