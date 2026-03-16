/** Stub Anthropic client */

export const CHAT_MODEL_FAST = 'claude-haiku-4-5-20251001'

interface Message {
  role: string
  content: string
}

export async function chatComplete(
  _model: string,
  _messages: Message[],
  _options?: Record<string, unknown>
): Promise<string> {
  return JSON.stringify({ stub: true })
}

export async function chatStream(
  _model: string,
  _messages: Message[],
  _options?: Record<string, unknown>
): Promise<AsyncIterable<any>> {
  return {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          return { done: true, value: undefined }
        },
      }
    },
  }
}
