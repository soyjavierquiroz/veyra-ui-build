import { Suspense } from "react"
import { WhatsappOpClient } from "./whatsapp-op-client"

export default function WhatsappPage() {
  return (
    <Suspense fallback={null}>
      <WhatsappOpClient />
    </Suspense>
  )
}
