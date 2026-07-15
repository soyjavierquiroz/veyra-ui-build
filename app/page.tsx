import { FunnelOrchestrator } from "@/components/funnel/funnel-orchestrator"
import {
  FunnelErrorBoundary,
  FunnelRuntimeErrorCapture,
} from "@/components/funnel/funnel-error-boundary"
import { DirectVslPage } from "@/components/funnel/direct-vsl-page"

export default function Page() {
  if (process.env.NEXT_PUBLIC_FUNNEL_VARIANT === "direct-vsl") {
    return <DirectVslPage />
  }

  return (
    <FunnelErrorBoundary>
      <FunnelRuntimeErrorCapture />
      <FunnelOrchestrator />
    </FunnelErrorBoundary>
  )
}
