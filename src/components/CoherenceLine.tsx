'use client'

/**
 * CoherenceLine — Animated SVG path connecting phase paintings.
 *
 * A gold line that draws itself left to right, rising with coherence.
 * Like a rover's path tracing across terrain.
 */

import { motion } from 'framer-motion'

interface CoherenceLineProps {
  /** Coherence scores for each phase (0-100) */
  scores: number[]
  /** Total width of the line container */
  width: number
  /** Height of the line container */
  height?: number
  /** Animation delay */
  delay?: number
}

export function CoherenceLine({
  scores,
  width,
  height = 60,
  delay = 0.8,
}: CoherenceLineProps) {
  if (scores.length < 2) return null

  const padding = 60
  const usableWidth = width - padding * 2

  // Map scores to points — higher coherence = higher on the SVG (lower y)
  const points = scores.map((score, i) => {
    const x = padding + (i / (scores.length - 1)) * usableWidth
    const y = height - (score / 100) * (height - 16) - 8
    return { x, y }
  })

  // Build smooth curve through points
  const pathD = points.reduce((d, point, i) => {
    if (i === 0) return `M ${point.x} ${point.y}`
    const prev = points[i - 1]
    const cpx = (prev.x + point.x) / 2
    return `${d} C ${cpx} ${prev.y}, ${cpx} ${point.y}, ${point.x} ${point.y}`
  }, '')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {/* Ghost line — barely visible guide */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(255, 221, 136, 0.08)"
        strokeWidth={1}
      />

      {/* Animated gold line */}
      <motion.path
        d={pathD}
        fill="none"
        stroke="var(--gold)"
        strokeWidth={1.5}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.7 }}
        transition={{
          pathLength: { duration: 2, delay, ease: [0.25, 0.1, 0.25, 1] },
          opacity: { duration: 0.5, delay },
        }}
      />

      {/* Score dots at each point */}
      {points.map((point, i) => (
        <motion.circle
          key={i}
          cx={point.x}
          cy={point.y}
          r={3}
          fill="var(--gold)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.8, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: delay + 0.5 + i * 0.6,
            ease: 'easeOut',
          }}
        />
      ))}
    </svg>
  )
}
