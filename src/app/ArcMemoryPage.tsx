'use client'

/**
 * ArcMemoryPage — Client component that fetches arc data and renders.
 *
 * Defaults to demo=true for hackathon.
 * Shows a loading state while fetching, then the full arc.
 */

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArcMemory } from '@/components/ArcMemory'
import styles from './ArcMemoryPage.module.css'

interface ArcData {
  narrative: string
  phases: Array<{
    name: string
    month: string
    coherence: number
    description: string
  }>
  motifs: Array<{
    name: string
    evolution: string
  }>
  timeline: Array<{
    date: string
    event: string
  }>
}

export function ArcMemoryPage() {
  const searchParams = useSearchParams()
  const isDemo = searchParams.get('demo') !== 'false' // default to demo
  const [arc, setArc] = useState<ArcData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchArc() {
      try {
        const url = isDemo
          ? '/api/agent/arc?demo=true'
          : '/api/agent/arc'
        const res = await fetch(url)
        const data = await res.json()

        if (data.arc) {
          setArc(data.arc)
        } else {
          setError(data.message ?? 'No arc data available')
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    fetchArc()
  }, [isDemo])

  return (
    <main className={styles.main}>
      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            className={styles.loading}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className={styles.loadingOrb} />
            <p className={styles.loadingText}>
              Reconstructing arc from memory
            </p>
          </motion.div>
        )}

        {!loading && error && (
          <motion.div
            key="error"
            className={styles.error}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p>{error}</p>
          </motion.div>
        )}

        {!loading && arc && (
          <motion.div
            key="arc"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <ArcMemory arc={arc} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
