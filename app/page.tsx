import { FunnelOrchestrator } from "@/components/funnel/funnel-orchestrator"
import {
  FunnelErrorBoundary,
  FunnelRuntimeErrorCapture,
} from "@/components/funnel/funnel-error-boundary"

export default function Page() {
  return (
    <FunnelErrorBoundary>
      <FunnelRuntimeErrorCapture />
      <FunnelOrchestrator />
    </FunnelErrorBoundary>
  )
}
