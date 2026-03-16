/**
 * Seed Demo Data — 7 synthetic MemCells that tell a transformation arc.
 *
 * Arc: ENDING (Jan) → stuck 3 weeks → LIMINAL (Feb) → threshold moment → EMERGING (Mar)
 * Recurring motif: sovereignty
 * Shadow thread: fear of being unseen
 * Archetype evolution: Warrior dismissed → most-consulted
 *
 * Usage: npm run seed
 * Requires: EVERMIND_API_URL and EVERMIND_API_KEY in .env.local
 */

import 'dotenv/config';

const API_URL = process.env.EVERMIND_API_URL ?? 'https://api.evermind.ai/api/v0';
const API_KEY = process.env.EVERMIND_API_KEY ?? '';
const USER_ID = 'demo_user';

interface MemCell {
  message_id: string;
  create_time: string;
  sender: string;
  content: string;
  metadata: {
    group_id: string;
    tags: string[];
    scene: string;
  };
}

const SEED_DATA: MemCell[] = [
  // ── Week 1 (Jan 6): ENDING phase, low coherence ──
  {
    message_id: 'coherence-demo-001',
    create_time: '2026-01-06T08:30:00Z',
    sender: USER_ID,
    content: 'Coherence check: overall 38. Factors: stability=32, vitality=35, agency=28, connection=45, expression=40, clarity=36, wholeness=50. Dominant: wholeness. Weakest: agency. Mode: morning. Everything feels like it\'s ending but I can\'t name what.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['coherence-check', 'phase:ENDING', 'tier:low', 'dominant:wholeness'],
      scene: 'daily-practice',
    },
  },

  // ── Week 3 (Jan 20): Council session — Warrior dismissed ──
  {
    message_id: 'council-demo-002',
    create_time: '2026-01-20T19:15:00Z',
    sender: USER_ID,
    content: 'Council deliberation on "Why can\'t I act on what I know?" Archetypes present: Sage, Warrior, Lover. Warrior urged decisive break from old role. User dismissed Warrior as "too aggressive, not me." Sage reframed as identity question. Lover named grief of letting go. Synthesis: "You know the answer. You\'re grieving the version of yourself that doesn\'t." User reaction: resistant.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['council', 'archetype:sage', 'archetype:warrior', 'archetype:lover'],
      scene: 'council-session',
    },
  },

  // ── Week 6 (Feb 10): Threshold moment — dissolution ──
  {
    message_id: 'myth-demo-003',
    create_time: '2026-02-10T21:45:00Z',
    sender: USER_ID,
    content: 'Threshold moment (dissolution): "I realized the role I\'ve been performing isn\'t mine anymore. I\'ve been wearing it like armor." Motifs: identity_dissolution, mask_removal, sovereignty. Polarities: authenticity↔belonging (tension: 0.85), sovereignty↔safety (tension: 0.72). Shadow contacted: fear of being unseen without the mask. Coherence at moment: 45.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['myth-event', 'type:dissolution', 'phase:LIMINAL', 'motif:identity_dissolution', 'motif:mask_removal', 'motif:sovereignty'],
      scene: 'interior-threshold',
    },
  },

  // ── Week 7 (Feb 17): Coherence rising, LIMINAL phase ──
  {
    message_id: 'coherence-demo-004',
    create_time: '2026-02-17T08:00:00Z',
    sender: USER_ID,
    content: 'Coherence check: overall 55. Factors: stability=48, vitality=52, agency=58, connection=50, expression=62, clarity=55, wholeness=60. Dominant: expression. Weakest: stability. Mode: morning. Something shifted after the dissolution. Agency climbing for the first time in weeks.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['coherence-check', 'phase:LIMINAL', 'tier:mid', 'dominant:expression'],
      scene: 'daily-practice',
    },
  },

  // ── Week 8 (Feb 24): Shadow session — fear of being unseen ──
  {
    message_id: 'myth-demo-005',
    create_time: '2026-02-24T20:30:00Z',
    sender: USER_ID,
    content: 'Threshold moment (encounter): "The fear of being unseen isn\'t about visibility — it\'s about being seen as I actually am, not as the role." Motifs: sovereignty, authenticity, shadow_integration. Polarities: visibility↔vulnerability (tension: 0.68). Shadow contacted: fear of being unseen — second encounter, deeper this time. Coherence at moment: 62.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['myth-event', 'type:encounter', 'phase:LIMINAL', 'motif:sovereignty', 'motif:authenticity', 'motif:shadow_integration'],
      scene: 'interior-threshold',
    },
  },

  // ── Week 10 (Mar 10): Council — Warrior now consulted, resonant ──
  {
    message_id: 'council-demo-006',
    create_time: '2026-03-10T18:00:00Z',
    sender: USER_ID,
    content: 'Council deliberation on "How do I step into what\'s next without a map?" Archetypes present: Warrior, Sage, Sovereign. Warrior spoke first: "You already have the map — it\'s the pattern you\'ve been living. Stop waiting for permission." User leaned in — first time Warrior resonated. Sage affirmed: "Sovereignty was always the motif." Sovereign offered: "You don\'t find sovereignty. You practice it." Synthesis: "The map is the motif. Sovereignty isn\'t ahead of you — it\'s what you\'ve been building." User reaction: deeply resonant. Convergence signal: strong.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['council', 'archetype:warrior', 'archetype:sage', 'archetype:sovereign'],
      scene: 'council-session',
    },
  },

  // ── Week 11 (Mar 14): Coherence high, EMERGING phase ──
  {
    message_id: 'coherence-demo-007',
    create_time: '2026-03-14T08:15:00Z',
    sender: USER_ID,
    content: 'Coherence check: overall 76. Factors: stability=70, vitality=78, agency=85, connection=68, expression=80, clarity=82, wholeness=72. Dominant: agency. Weakest: connection. Mode: morning. Agency is the highest it\'s been. Connection still needs work — sovereignty without isolation is the next edge.',
    metadata: {
      group_id: `user-${USER_ID}`,
      tags: ['coherence-check', 'phase:EMERGING', 'tier:high', 'dominant:agency'],
      scene: 'daily-practice',
    },
  },
];

async function seed() {
  console.log(`Seeding ${SEED_DATA.length} MemCells to ${API_URL}...`);
  console.log(`User: ${USER_ID}\n`);

  for (const cell of SEED_DATA) {
    try {
      const res = await fetch(`${API_URL}/memories`, {
        method: 'POST',
        headers: {
          ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cell),
      });

      const data = await res.json();

      if (res.ok) {
        console.log(`  ✓ ${cell.message_id} (${cell.metadata.tags[0]})`);
      } else {
        console.error(`  ✗ ${cell.message_id}: ${JSON.stringify(data)}`);
      }
    } catch (err) {
      console.error(`  ✗ ${cell.message_id}: ${(err as Error).message}`);
    }
  }

  console.log('\nDone. Run smoke-test to verify retrieval.');
}

seed();
