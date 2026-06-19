"use client"

type DummyProgressBarProps = {
  progress: number
  debugLabel?: string
}

function clampProgress(progress: number) {
  return Math.max(0, Math.min(100, progress))
}

export function DummyProgressBar({
  progress,
  debugLabel,
}: DummyProgressBarProps) {
  const clampedProgress = clampProgress(progress)

  return (
    <div
      className="vsl-dummy-progress"
      data-progress={Math.round(clampedProgress)}
      data-debug-label={debugLabel}
    >
      <div
        className="vsl-dummy-progress__fill"
        style={{
          transform: `scaleX(${clampedProgress / 100})`,
        }}
      />
    </div>
  )
}
