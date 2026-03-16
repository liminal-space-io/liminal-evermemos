/**
 * EverMemOS / Evermind Types
 *
 * Evermind Cloud API (api.evermind.ai/api/v0)
 * MemCell — atomic memory unit. Groups into MemScenes via metadata.group_id.
 */

/** Atomic memory unit sent to Evermind */
export interface EverMemOSMessage {
  /** Unique ID per MemCell */
  message_id: string
  /** ISO8601 timestamp */
  create_time: string
  /** 'user' | 'assistant' | 'system' */
  sender: string
  /** Natural-language memory content (episodic trace) */
  content: string
  /** Metadata for grouping, tagging, and scene classification */
  metadata: {
    group_id: string
    tags: string[]
    scene: string
  }
}

/** Result from Evermind memory search */
export interface MemoryResult {
  content: string
  score?: number
  metadata?: Record<string, unknown>
}
