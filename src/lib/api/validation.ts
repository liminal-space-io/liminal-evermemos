/** Stub validation */

export const createCoherenceSchema = {} as any
export const getCoherenceSchema = {} as any

type ValidationResult<T> = { success: true; data: T } | { success: false; error: string }

export function validateRequest(_schema: any, body: any): ValidationResult<any> {
  return { success: true, data: body }
}

export function validateSearchParams(_schema: any, params: URLSearchParams): ValidationResult<{
  userId: string
  timeWindow: number
  startDate?: string
  endDate?: string
}> {
  return {
    success: true,
    data: {
      userId: params.get('userId') || '',
      timeWindow: Number(params.get('timeWindow')) || 30,
      startDate: params.get('startDate') || undefined,
      endDate: params.get('endDate') || undefined,
    },
  }
}
