/**
 * Arc Memory — Root Page
 *
 * Renders the transformation arc experience.
 * ?demo=true → fetches from /api/agent/arc?demo=true (zero auth, hardcoded data)
 * Otherwise → requires authentication and real EverMemOS data.
 *
 * Default: demo mode for hackathon judges.
 */

import { Suspense } from 'react'
import { ArcMemoryPage } from './ArcMemoryPage'

export default function Page() {
  return (
    <Suspense>
      <ArcMemoryPage />
    </Suspense>
  )
}
