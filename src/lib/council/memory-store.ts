/** Stub council memory store */
export async function saveDeliberationMemory(
  _userId: string,
  _data: { topic: string; archetypes: string[]; synthesis: string }
): Promise<string | null> {
  return 'stub-conversation-id'
}
