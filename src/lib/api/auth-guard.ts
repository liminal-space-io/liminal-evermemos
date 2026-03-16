/** Stub auth guard */
import { NextResponse } from 'next/server'

export async function requireAuthentication(): Promise<{ id: string } | NextResponse> {
  return { id: 'stub-user' }
}

export async function requireAuth(_userId: string): Promise<void | NextResponse> {
  return
}

interface Actor {
  type: 'user' | 'guest'
  id: string
}

export async function resolveActor(_request: Request): Promise<Actor> {
  return { type: 'user', id: 'stub-user' }
}
