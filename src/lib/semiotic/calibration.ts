/** Stub semiotic calibration */
import type { SemioticMapping } from './types'

export async function getCalibrationScore(_userId: string): Promise<number> {
  return 0
}

export async function shouldTriggerCalibration(_userId: string): Promise<boolean> {
  return false
}

export async function getUserSemioticMappings(_userId: string): Promise<SemioticMapping[]> {
  return []
}

export async function initializeSemioticMappings(_userId: string): Promise<void> {
  // no-op stub
}
