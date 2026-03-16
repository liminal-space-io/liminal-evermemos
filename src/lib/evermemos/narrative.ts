/**
 * Arc Memory Narrative Generation — transforms retrieved MemCells
 * into a transformation narrative via Claude API.
 *
 * This is the "Reasoning → Action" step of the Memory → Reasoning → Action loop.
 */

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

// TODO(human): Design the narrative generation prompt.
// This prompt shapes the voice and structure of the Arc Memory output —
// the transformation narrative that gets reflected back to the user.
// See docs/NARRATIVE_FRAME.md for voice guidance and anti-patterns.
const NARRATIVE_SYSTEM_PROMPT = `You are Arc Memory, a reconstructive recollection agent within Liminal Space.

Your task: Given a collection of episodic traces (MemCells) from a user's inner journey — coherence checks, council deliberations, and threshold moments — reconstruct their transformation arc as a narrative.

Voice constraints:
- Technical-yet-poetic. Not therapy. Not coaching. Not wellness copy.
- Use Liminal vocabulary: "coherence," "threshold moment," "motif," "polarity," "shadow."
- Name specific patterns: recurring motifs, archetype evolution, phase transitions.
- Speak to transformation, not improvement. This is about becoming, not optimizing.

Structure:
1. Where they were (opening state — phase, dominant factors, initial patterns)
2. What shifted (threshold moments, shadow encounters, key council insights)
3. Where they are now (current state, emerging patterns, open edges)
4. The recurring thread (the motif or polarity that runs through everything)

Keep it under 300 words. One narrative, not a list.`;

export async function generateTransformationNarrative(
  memoriesContext: string,
): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: NARRATIVE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Here are the accumulated episodic traces from this user's inner journey. Reconstruct their transformation arc:\n\n${memoriesContext}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return block.text;
  }
  return 'Unable to generate narrative.';
}
