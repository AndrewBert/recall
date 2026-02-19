import type { Env } from '../../types'

interface UndoBody {
  cardId: number
  previousCard: {
    due: string
    stability: number
    difficulty: number
    elapsed_days: number
    scheduled_days: number
    learning_steps: number
    reps: number
    lapses: number
    state: number
    lastReview?: string | null
  }
}

function isNonNegative(v: unknown): v is number {
  return typeof v === 'number' && v >= 0
}

function isNonNegativeInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const reviewLogId = Number(context.params.id)
  if (!Number.isInteger(reviewLogId) || reviewLogId <= 0) {
    return Response.json({ error: 'Invalid review log ID' }, { status: 400 })
  }

  let body: UndoBody
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.cardId || !body.previousCard) {
    return Response.json(
      { error: 'cardId and previousCard are required' },
      { status: 400 },
    )
  }

  const p = body.previousCard
  if (
    typeof p.due !== 'string' ||
    !isNonNegative(p.stability) ||
    !isNonNegative(p.difficulty) ||
    !isNonNegative(p.elapsed_days) ||
    !isNonNegative(p.scheduled_days) ||
    !isNonNegative(p.learning_steps) ||
    !isNonNegativeInt(p.reps) ||
    !isNonNegativeInt(p.lapses) ||
    ![0, 1, 2, 3].includes(p.state)
  ) {
    return Response.json({ error: 'Invalid previousCard fields' }, { status: 400 })
  }

  // Verify review log exists
  const existing = await context.env.DB.prepare(
    'SELECT id FROM review_logs WHERE id = ? AND card_id = ?',
  ).bind(reviewLogId, body.cardId).first()

  if (!existing) {
    return Response.json({ error: 'Review log not found' }, { status: 404 })
  }

  // Atomic: delete review log + restore card to previous state
  await context.env.DB.batch([
    context.env.DB.prepare('DELETE FROM review_logs WHERE id = ?').bind(reviewLogId),
    context.env.DB.prepare(`
      UPDATE cards SET due = ?, stability = ?, difficulty = ?, elapsed_days = ?,
        scheduled_days = ?, learning_steps = ?, reps = ?, lapses = ?, state = ?, last_review = ?
      WHERE id = ?
    `).bind(
      p.due, p.stability, p.difficulty, p.elapsed_days,
      p.scheduled_days, p.learning_steps, p.reps, p.lapses, p.state, p.lastReview ?? null,
      body.cardId,
    ),
  ])

  return Response.json({ ok: true })
}
