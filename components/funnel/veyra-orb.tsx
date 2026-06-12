"use client"

import { cn } from "@/lib/utils"

export function VeyraOrb({
  size = 160,
  active = true,
  className,
}: {
  size?: number
  active?: boolean
  className?: string
}) {
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* outer halo ring */}
      <div
        className="absolute inset-0 rounded-full animate-halo-spin"
        style={{
          background:
            "conic-gradient(from 0deg, transparent, oklch(0.7 0.16 300 / 0.7), transparent, oklch(0.82 0.12 85 / 0.5), transparent)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
          WebkitMask:
            "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
        }}
      />
      {/* glow */}
      <div
        className={cn(
          "absolute rounded-full blur-2xl",
          active && "animate-mystic-pulse",
        )}
        style={{
          width: size * 0.8,
          height: size * 0.8,
          background:
            "radial-gradient(circle, oklch(0.62 0.18 300 / 0.9), oklch(0.5 0.14 300 / 0.3) 60%, transparent 75%)",
        }}
      />
      {/* core sphere */}
      <div
        className={cn("relative rounded-full", active && "animate-mystic-pulse")}
        style={{
          width: size * 0.46,
          height: size * 0.46,
          background:
            "radial-gradient(circle at 35% 30%, oklch(0.9 0.05 300), oklch(0.55 0.2 300) 55%, oklch(0.3 0.12 295) 100%)",
          boxShadow:
            "0 0 30px oklch(0.62 0.18 300 / 0.8), inset 0 0 20px oklch(0.95 0.05 300 / 0.6)",
        }}
      />
    </div>
  )
}
