/**
 * EverMemOS Client — TypeScript wrapper for the EverMemOS API v1.
 *
 * Handles episodic trace ingestion (POST /memories) and
 * semantic/agentic retrieval (GET /memories/search).
 */

const EVERMIND_API_URL = process.env.EVERMIND_API_URL ?? 'http://localhost:1995/api/v1';
const EVERMIND_API_KEY = process.env.EVERMIND_API_KEY ?? '';

interface MemCellInput {
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

interface SearchInput {
  query: string;
  user_id: string;
  retrieve_method?: 'keyword' | 'vector' | 'hybrid' | 'rrf' | 'agentic';
  memory_types?: Array<'episodic_memory' | 'profile' | 'foresight' | 'event_log'>;
}

interface EverMemOSResponse<T = unknown> {
  status: string;
  message: string;
  result: T;
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  if (EVERMIND_API_KEY) {
    h['Authorization'] = `Bearer ${EVERMIND_API_KEY}`;
  }
  return h;
}

/** Store an episodic trace (MemCell) in EverMemOS. */
export async function storeMemory(input: MemCellInput): Promise<EverMemOSResponse> {
  const res = await fetch(`${EVERMIND_API_URL}/memories`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(input),
  });
  return res.json();
}

/** Search memories using hybrid or agentic retrieval. */
export async function searchMemories(input: SearchInput): Promise<EverMemOSResponse> {
  const res = await fetch(`${EVERMIND_API_URL}/memories/search`, {
    method: 'GET',
    headers: headers(),
    body: JSON.stringify(input),
  });
  return res.json();
}

/** Health check — verify EverMemOS is reachable. */
export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${EVERMIND_API_URL.replace('/api/v1', '')}/health`);
  return res.json();
}
