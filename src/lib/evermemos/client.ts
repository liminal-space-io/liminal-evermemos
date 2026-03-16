import 'server-only'

/**
 * Evermind Cloud API Client
 *
 * Base URL: https://api.evermind.ai/api/v0
 * Auth: Bearer token via EVERMIND_API_KEY
 *
 * All methods gate on EVERMIND_API_KEY presence — returns silently when unconfigured.
 * Never throws — logs errors and returns empty/fallback values.
 */

import { createModuleLogger } from '@/lib/logger'
import type { EverMemOSMessage, MemoryResult } from './types'

const log = createModuleLogger('evermind')

function getBaseUrl(): string {
  return process.env.EVERMIND_API_URL || 'https://api.evermind.ai/api/v0'
}

function getApiKey(): string | undefined {
  return process.env.EVERMIND_API_KEY
}

function isEnabled(): boolean {
  return process.env.EVERMEMOS_ENABLED === 'true' && !!getApiKey()
}

function authHeaders(): Record<string, string> {
  const key = getApiKey()
  return {
    'Content-Type': 'application/json',
    ...(key ? { Authorization: `Bearer ${key}` } : {}),
  }
}

async function safeFetch(
  url: string,
  options: RequestInit & { timeout?: number }
): Promise<Response | null> {
  const { timeout = 10000, ...fetchOptions } = options
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    })
    return response
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      log.warn({ url }, 'Evermind request timed out')
    } else {
      log.warn({ err, url }, 'Evermind request failed')
    }
    return null
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Store a MemCell in Evermind episodic memory.
 * POST /memories
 *
 * Sends one memory per call (Evermind Cloud API format).
 * For multiple MemCells, calls are batched sequentially.
 */
export async function storeMemory(messages: EverMemOSMessage[]): Promise<void> {
  if (!isEnabled() || messages.length === 0) return

  for (const msg of messages) {
    const response = await safeFetch(`${getBaseUrl()}/memories`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(msg),
      timeout: 10000,
    })

    if (response && !response.ok) {
      const body = await response.text().catch(() => '')
      log.warn(
        { status: response.status, messageId: msg.message_id, body },
        'Evermind store returned non-OK status'
      )
    }
  }
}

/**
 * Search Evermind memories via semantic/hybrid/agentic retrieval.
 * GET /memories/search (with query params)
 *
 * @param method - 'hybrid' (BM25+vector), 'lightweight' (keyword), or 'agentic' (LLM-guided)
 */
// Cache whether search API prefers POST over GET (discovered on first 405)
let searchUsesPost = false

export async function searchMemories(
  query: string,
  userId: string,
  method: 'hybrid' | 'lightweight' | 'agentic' = 'hybrid',
  limit: number = 10,
  tags?: string
): Promise<MemoryResult[]> {
  if (!isEnabled()) return []

  const searchBody = {
    query,
    retrieve_method: method,
    group_id: `user-${userId}`,
    limit,
    ...(tags ? { tags } : {}),
  }

  let response: Response | null

  if (searchUsesPost) {
    response = await safeFetch(`${getBaseUrl()}/memories/search`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(searchBody),
      timeout: 15000,
    })
  } else {
    const params = new URLSearchParams({
      query,
      retrieve_method: method,
      group_id: `user-${userId}`,
      limit: String(limit),
      ...(tags ? { tags } : {}),
    })

    response = await safeFetch(`${getBaseUrl()}/memories/search?${params}`, {
      method: 'GET',
      headers: authHeaders(),
      timeout: 15000,
    })

    // POST fallback: if GET returns 405, retry as POST and cache for future calls
    if (response?.status === 405) {
      log.info('Evermind search: GET returned 405, switching to POST')
      searchUsesPost = true
      response = await safeFetch(`${getBaseUrl()}/memories/search`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(searchBody),
        timeout: 15000,
      })
    }
  }

  if (!response || !response.ok) return []

  try {
    const data = await response.json()
    const memories = data.memories ?? data.results ?? data ?? []
    if (!Array.isArray(memories)) return []
    return memories.map((m: Record<string, unknown>) => ({
      content: String(m.content ?? m.text ?? ''),
      score: typeof m.score === 'number' ? m.score : undefined,
      metadata: m.metadata as Record<string, unknown> | undefined,
    }))
  } catch (err) {
    log.warn({ err }, 'Failed to parse Evermind search response')
    return []
  }
}

/**
 * Health check — GET /health
 */
export async function healthCheck(): Promise<boolean> {
  if (!isEnabled()) return false

  const response = await safeFetch(`${getBaseUrl()}/health`, {
    method: 'GET',
    headers: authHeaders(),
    timeout: 5000,
  })

  return response !== null && response.ok
}

/**
 * Graceful fallback wrapper for Evermind calls.
 * Returns fallback value if Evermind is disabled, errors, or times out.
 */
export async function withEverMemOSFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  context: string
): Promise<T> {
  if (!isEnabled()) return fallback
  try {
    return await Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Evermind timeout')), 5000)
      ),
    ])
  } catch (err) {
    log.warn({ err, context }, 'Evermind fallback triggered')
    return fallback
  }
}
