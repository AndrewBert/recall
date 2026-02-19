import type { Env } from '../../types'

interface ReviewBody {
  cardId: number
  updatedCard: {
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
  reviewLog: {
    rating: number
    state: number
    due: string
    stability: number
    difficulty: number
    elapsed_days: number
    last_elapsed_days: number
    scheduled_days: number
    learning_steps: number
    review: string
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: ReviewBody
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.cardId || !body.updatedCard || !body.reviewLog) {
    return Response.json(
      { error: 'cardId, updatedCard, and reviewLog are required' },
      { status: 400 },
    )
  }

  const existing = await context.env.DB.prepare('SELECT id FROM cards WHERE id = ?')
    .bind(body.cardId).first()
  if (!existing) {
    return Response.json({ error: 'Card not found' }, { status: 404 })
  }

  const c = body.updatedCard
  const l = body.reviewLog

  // Atomic: update card FSRS fields + insert review log
  await context.env.DB.batch([
    context.env.DB.prepare(`
      UPDATE cards SET due = ?, stability = ?, difficulty = ?, elapsed_days = ?,
        scheduled_days = ?, learning_steps = ?, reps = ?, lapses = ?, state = ?, last_review = ?
      WHERE id = ?
    `).bind(
      c.due, c.stability, c.difficulty, c.elapsed_days,
      c.scheduled_days, c.learning_steps, c.reps, c.lapses, c.state, c.lastReview ?? null,
      body.cardId,
    ),
    context.env.DB.prepare(`
      INSERT INTO review_logs (card_id, rating, state, due, stability, difficulty,
        elapsed_days, last_elapsed_days, scheduled_days, learning_steps, review)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.cardId, l.rating, l.state, l.due, l.stability, l.difficulty,
      l.elapsed_days, l.last_elapsed_days, l.scheduled_days, l.learning_steps, l.review,
    ),
  ])

  // Get the inserted review log ID
  const logRow = await context.env.DB.prepare(
    'SELECT id FROM review_logs WHERE card_id = ? ORDER BY id DESC LIMIT 1',
  ).bind(body.cardId).first<{ id: number }>()

  // Return the full updated card
  const row = await context.env.DB.prepare('SELECT * FROM cards WHERE id = ?')
    .bind(body.cardId).first()

  return Response.json({
    reviewLogId: logRow!.id,
    card: {
      id: row!.id,
      deckId: row!.deck_id,
      front: row!.front,
      back: row!.back,
      due: row!.due,
      stability: row!.stability,
      difficulty: row!.difficulty,
      elapsed_days: row!.elapsed_days,
      scheduled_days: row!.scheduled_days,
      learning_steps: row!.learning_steps,
      reps: row!.reps,
      lapses: row!.lapses,
      state: row!.state,
      lastReview: row!.last_review,
    },
  })
}
