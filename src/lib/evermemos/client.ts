/**
 * EverMemOS Client — TypeScript wrapper for the EverMemOS API v1.
 *
 * Handles episodic trace ingestion (POST /memories) and
 * semantic/agentic retrieval (GET /memories/search).
 *
 * Graceful degradation: if EverMemOS is unreachable, functions return
 * a failure response instead of throwing — the app continues without memory.
 */

const EVERMIND_API_URL = process.env.EVERMIND_API_URL ?? 'http://localhost:1995/api/v1';
const EVERMIND_API_KEY = process.env.EVERMIND_API_KEY ?? '';

export interface MemCellInput {
  message_id: string;
  create_time: string;
  sender: string;
  content: string;
  metadata?: {
    group_id?: string;
    tags?: string[];
    scene?: string;
  };
}

export interface SearchInput {
  query: string;
  user_id: string;
  retrieve_method?: 'keyword' | 'vector' | 'hybrid' | 'rrf' | 'agentic';
  memory_types?: Array<'episodic_memory' | 'profile' | 'foresight' | 'event_log'>;
}

export interface EverMemOSResponse<T = unknown> {
  status: string;
  message: string;
  result: T;
}

const TIMEOUT_MS = 10_000;

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EVERMIND_API_KEY) {
    h['Authorization'] = `Bearer ${EVERMIND_API_KEY}`;
  }
  return h;
}

function failResponse(error: string): EverMemOSResponse<null> {
  return { status: 'error', message: error, result: null };
}

/** Store an episodic trace (MemCell) in EverMemOS. */
export async function storeMemory(input: MemCellInput): Promise<EverMemOSResponse> {
  try {
    const res = await fetch(`${EVERMIND_API_URL}/memories`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return failResponse(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
  } catch (err) {
    return failResponse(`EverMemOS unreachable: ${(err as Error).message}`);
  }
}

/** Search memories using hybrid or agentic retrieval. */
export async function searchMemories(input: SearchInput): Promise<EverMemOSResponse> {
  try {
    const res = await fetch(`${EVERMIND_API_URL}/memories/search`, {
      method: 'GET',
      headers: headers(),
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      return failResponse(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
  } catch (err) {
    return failResponse(`EverMemOS unreachable: ${(err as Error).message}`);
  }
}

/** Health check — verify EverMemOS is reachable. */
export async function healthCheck(): Promise<{ status: string }> {
  try {
    const res = await fetch(`${EVERMIND_API_URL.replace('/api/v1', '')}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    return res.json();
  } catch {
    return { status: 'unreachable' };
  }
}
