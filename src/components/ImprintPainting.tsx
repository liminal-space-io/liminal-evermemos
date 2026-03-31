'use client'

/**
 * ImprintPainting — Simplified impressionist SVG for hackathon demo.
 *
 * Captures the core aesthetic of the full ImprintRenderer:
 * - Phase-based hue (rose → violet → teal)
 * - Filled circles at 8-18% opacity in 7 radial clusters (coherence factors)
 * - SVG filter chain: turbulence warp + gaussian blur + saturation boost
 * - Breathing animation (subtle scale pulse)
 *
 * Self-contained. No external rendering libs required.
 */

import { useMemo } from 'react'
import { motion } from 'framer-motion'

// ── Phase → hue mapping (from ImprintRenderer PHASE_HUES) ────────────────────

const PHASE_HUES: Record<string, number> = {
  ENDING: 348,      // rose
  LIMINAL: 270,     // violet
  EMERGING: 175,    // teal
  // Semiotic phases (lowercase)
  initiation: 220,
  dissolution: 270,
  liminal: 300,
  integration: 40,
  emergence: 80,
}

// ── Factor hues — chakra-aligned (from ImprintRenderer) ──────────────────────

const FACTOR_HUES: Record<string, number> = {
  stability: 348,
  vitality: 39,
  agency: 54,
  connection: 95,
  expression: 187,
  clarity: 256,
  wholeness: 300,
}

const FACTORS = Object.keys(FACTOR_HUES)

// ── Seeded PRNG ──────────────────────────────────────────────────────────────

function seededRand(seed: number) {
  let s = seed | 0
  return () => {
    s = (Math.imul(s, 16807) + 0) | 0
    if (s <= 0) s += 2147483646
    return (s - 1) / 2147483646
  }
}

// ── Types ────────────────────────────────────────────────────────────────────

interface ImprintPaintingProps {
  phase: string
  coherence: number // 0-100
  size?: number
  seed?: number
  /** 0-1, controls blur and density */
  intensity?: number
  /** Animation delay in seconds */
  delay?: number
  className?: string
}

// ── Component ────────────────────────────────────────────────────────────────

export function ImprintPainting({
  phase,
  coherence,
  size = 200,
  seed = 42,
  intensity = 0.7,
  delay = 0,
  className,
}: ImprintPaintingProps) {
  const filterId = `imprint-filter-${phase}-${seed}`
  const coherenceNorm = coherence / 100
  const baseHue = PHASE_HUES[phase] ?? 300

  // Generate paint strokes (filled circles)
  const strokes = useMemo(() => {
    const rand = seededRand(seed)
    const cx = size / 2
    const cy = size / 2
    const maxR = size * 0.42
    const result: Array<{
      x: number
      y: number
      r: number
      hue: number
      opacity: number
    }> = []

    // 7 clusters — one per coherence factor
    for (let f = 0; f < 7; f++) {
      const factor = FACTORS[f]
      const factorHue = FACTOR_HUES[factor]
      // Distribute clusters radially
      const clusterAngle = (f / 7) * Math.PI * 2 + rand() * 0.3
      // Factor strength varies with coherence — higher coherence = more spread
      const factorStrength = 0.3 + coherenceNorm * 0.5 + rand() * 0.2
      const clusterDist = maxR * (0.2 + factorStrength * 0.6)
      const clusterCx = cx + Math.cos(clusterAngle) * clusterDist * 0.5
      const clusterCy = cy + Math.sin(clusterAngle) * clusterDist * 0.5

      // Number of circles per cluster
      const count = Math.floor(8 + coherenceNorm * 12 + rand() * 6)

      for (let i = 0; i < count; i++) {
        const angle = rand() * Math.PI * 2
        const dist = Math.sqrt(rand()) * clusterDist * 0.4
        const x = clusterCx + Math.cos(angle) * dist
        const y = clusterCy + Math.sin(angle) * dist

        // Blend factor hue with phase hue
        const hueBlend = 0.3 + rand() * 0.4
        const hue = factorHue * hueBlend + baseHue * (1 - hueBlend)

        result.push({
          x,
          y,
          r: 2 + rand() * 6 + coherenceNorm * 3,
          hue: ((hue % 360) + 360) % 360,
          opacity: 0.10 + rand() * 0.18,
        })
      }
    }

    // Center glow — a few larger, more saturated circles
    for (let i = 0; i < 5; i++) {
      const angle = rand() * Math.PI * 2
      const dist = rand() * maxR * 0.15
      result.push({
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        r: 8 + rand() * 12,
        hue: baseHue,
        opacity: 0.08 + rand() * 0.10,
      })
    }

    return result
  }, [phase, coherence, size, seed, baseHue, coherenceNorm])

  // Filter params based on intensity and coherence
  const blurAmount = 1.5 + intensity * 2.5 - coherenceNorm * 1.0
  const displacementScale = 10 + intensity * 8

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 1.8,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{
          display: 'block',
          animation: `breathe-${seed} 6s ease-in-out infinite`,
          animationDelay: `${delay + 2}s`,
        }}
      >
        <defs>
          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
            {/* Turbulence warp */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves={3}
              seed={seed}
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale={displacementScale}
              xChannelSelector="R"
              yChannelSelector="G"
              result="warped"
            />
            {/* Gaussian blur — color bleed */}
            <feGaussianBlur
              in="warped"
              stdDeviation={blurAmount}
              result="blurred"
            />
            {/* Saturation boost */}
            <feColorMatrix
              in="blurred"
              type="saturate"
              values="1.3"
            />
          </filter>
          {/* Circular clip */}
          <clipPath id={`clip-${filterId}`}>
            <circle cx={size / 2} cy={size / 2} r={size / 2} />
          </clipPath>
        </defs>

        <g
          clipPath={`url(#clip-${filterId})`}
          filter={`url(#${filterId})`}
        >
          {/* Background — deep phase-tinted dark */}
          <rect
            width={size}
            height={size}
            fill={`hsla(${baseHue}, 25%, 7%, 1)`}
          />

          {/* Atmospheric base wash — large soft circles */}
          <circle
            cx={size * 0.45}
            cy={size * 0.45}
            r={size * 0.35}
            fill={`hsla(${baseHue}, 50%, 25%, 0.12)`}
          />
          <circle
            cx={size * 0.55}
            cy={size * 0.55}
            r={size * 0.3}
            fill={`hsla(${baseHue + 30}, 45%, 20%, 0.10)`}
          />

          {/* Paint strokes */}
          {strokes.map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r={s.r}
              fill={`hsla(${s.hue}, 70%, 60%, ${s.opacity})`}
            />
          ))}
        </g>
      </svg>

      {/* Breathing animation keyframes */}
      <style>{`
        @keyframes breathe-${seed} {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.015); }
        }
      `}</style>
    </motion.div>
  )
}
