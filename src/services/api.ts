import type { CardRecord } from '../models/types'

const BASE_URL = import.meta.env.VITE_API_URL || ''
const API_KEY = import.meta.env.VITE_API_KEY || ''

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }))
    throw new ApiError(body.error || res.statusText, res.status)
  }

  return res.json()
}

/** ISO-string field names that should be parsed to Date objects. */
const DATE_FIELDS = new Set(['due', 'createdAt', 'updatedAt', 'lastReview', 'review'])

/** Recursively convert known ISO-string fields to Date objects. */
export function parseDates<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(parseDates) as T

  const result = { ...obj } as Record<string, unknown>
  for (const key of Object.keys(result)) {
    const val = result[key]
    if (DATE_FIELDS.has(key) && typeof val === 'string') {
      result[key] = new Date(val)
    } else if (typeof val === 'object' && val !== null) {
      result[key] = parseDates(val)
    }
  }
  return result as T
}

/** API card shape (lastReview) → CardRecord (last_review) + parse dates. */
export function remapCardFromApi(apiCard: Record<string, unknown>): CardRecord {
  const parsed = parseDates(apiCard)
  const { lastReview, ...rest } = parsed as Record<string, unknown>
  return {
    ...rest,
    last_review: lastReview as Date | undefined,
  } as CardRecord
}

/** CardRecord fields → API card shape: serialize Dates to ISO, rename last_review → lastReview. */
export function remapCardToApi(
  fields: Partial<CardRecord> & { front?: string; back?: string },
): Record<string, unknown> {
  const { last_review, due, ...rest } = fields as Record<string, unknown>
  const result: Record<string, unknown> = { ...rest }
  if (due instanceof Date) result.due = due.toISOString()
  if (last_review instanceof Date) {
    result.lastReview = last_review.toISOString()
  } else if (last_review === undefined || last_review === null) {
    result.lastReview = last_review ?? null
  }
  return result
}
