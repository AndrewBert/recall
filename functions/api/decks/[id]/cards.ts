import type { Env } from '../../../types'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const deckId = Number(context.params.id)

  const { results } = await context.env.DB.prepare(
    'SELECT * FROM cards WHERE deck_id = ? ORDER BY id'
  ).bind(deckId).all()

  const cards = results.map((row) => ({
    id: row.id,
    deckId: row.deck_id,
    front: row.front,
    back: row.back,
    due: row.due,
    stability: row.stability,
    difficulty: row.difficulty,
    elapsed_days: row.elapsed_days,
    scheduled_days: row.scheduled_days,
    learning_steps: row.learning_steps,
    reps: row.reps,
    lapses: row.lapses,
    state: row.state,
    lastReview: row.last_review,
  }))

  return Response.json({ cards })
}
