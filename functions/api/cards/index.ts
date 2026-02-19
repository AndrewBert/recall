import type { Env } from '../../types'

interface CreateCardBody {
  deckId: number
  front: string
  back: string
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

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: CreateCardBody
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.deckId || !body.front?.trim() || !body.back?.trim()) {
    return Response.json({ error: 'deckId, front, and back are required' }, { status: 400 })
  }

  const result = await context.env.DB.prepare(`
    INSERT INTO cards (deck_id, front, back, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    body.deckId,
    body.front.trim(),
    body.back.trim(),
    body.due,
    body.stability,
    body.difficulty,
    body.elapsed_days,
    body.scheduled_days,
    body.learning_steps,
    body.reps,
    body.lapses,
    body.state,
    body.lastReview ?? null,
  ).run()

  return Response.json({
    card: {
      id: result.meta.last_row_id,
      deckId: body.deckId,
      front: body.front.trim(),
      back: body.back.trim(),
      due: body.due,
      stability: body.stability,
      difficulty: body.difficulty,
      elapsed_days: body.elapsed_days,
      scheduled_days: body.scheduled_days,
      learning_steps: body.learning_steps,
      reps: body.reps,
      lapses: body.lapses,
      state: body.state,
      lastReview: body.lastReview ?? null,
    },
  }, { status: 201 })
}
