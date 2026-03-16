/** Stub route helpers */
import { NextRequest, NextResponse } from 'next/server'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export const ERROR_CODES = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse | Response>,
  _name: string
) {
  return handler
}

export const CACHE_PRESETS = {
  short: { maxAge: 60 },
  medium: { maxAge: 300 },
} as const

export function getCacheHeaders(_preset: { maxAge: number }): Record<string, string> {
  return {}
}

export function createErrorResponse(opts: { message: string; code: string; status: number }) {
  return NextResponse.json({ error: opts.message, code: opts.code }, { status: opts.status })
}
