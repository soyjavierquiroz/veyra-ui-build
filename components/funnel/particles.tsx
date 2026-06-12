"use client"

import { useEffect, useState } from "react"

type Dot = {
  id: number
  left: number
  top: number
  size: number
  delay: number
  duration: number
}

export function Particles({ count = 24 }: { count?: number }) {
  const [dots, setDots] = useState<Dot[]>([])

  // Generate only on the client after mount to avoid hydration mismatch
  useEffect(() => {
    setDots(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: Math.random() * 3 + 1,
        delay: Math.random() * 5,
        duration: Math.random() * 6 + 6,
      })),
    )
  }, [count])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {dots.map((d) => (
        <span
          key={d.id}
          className="absolute rounded-full bg-primary/60"
          style={{
            left: `${d.left}%`,
            top: `${d.top}%`,
            width: d.size,
            height: d.size,
            animation: `float-up ${d.duration}s ease-in-out ${d.delay}s infinite alternate`,
            boxShadow: "0 0 6px oklch(0.7 0.16 300 / 0.8)",
          }}
        />
      ))}
    </div>
  )
}
