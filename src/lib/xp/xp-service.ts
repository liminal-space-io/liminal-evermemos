/** Stub XP service */
export async function awardXP(_userId: string, _opts: Record<string, unknown>) {
  return { xpAwarded: 0, newTotalXP: 0, newLevel: 1, leveledUp: false }
}

export async function getUserStreak(_userId: string): Promise<number> {
  return 0
}
