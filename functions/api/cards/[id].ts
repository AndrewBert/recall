import type { Env } from '../../types'

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const id = Number(context.params.id)
  let body: { front?: string; back?: string }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const existing = await context.env.DB.prepare('SELECT id FROM cards WHERE id = ?').bind(id).first()
  if (!existing) {
    return Response.json({ error: 'Card not found' }, { status: 404 })
  }

  const updates: string[] = []
  const values: (string | number)[] = []

  if (body.front !== undefined) {
    updates.push('front = ?')
    values.push(body.front.trim())
  }
  if (body.back !== undefined) {
    updates.push('back = ?')
    values.push(body.back.trim())
  }

  if (updates.length === 0) {
    return Response.json({ error: 'No fields to update' }, { status: 400 })
  }

  values.push(id)
  await context.env.DB.prepare(
    `UPDATE cards SET ${updates.join(', ')} WHERE id = ?`
  ).bind(...values).run()

  const row = await context.env.DB.prepare('SELECT * FROM cards WHERE id = ?').bind(id).first()

  return Response.json({
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

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = Number(context.params.id)

  const existing = await context.env.DB.prepare('SELECT id FROM cards WHERE id = ?').bind(id).first()
  if (!existing) {
    return Response.json({ error: 'Card not found' }, { status: 404 })
  }

  // D1 doesn't enforce PRAGMA foreign_keys, so cascade manually
  await context.env.DB.batch([
    context.env.DB.prepare('DELETE FROM review_logs WHERE card_id = ?').bind(id),
    context.env.DB.prepare('DELETE FROM cards WHERE id = ?').bind(id),
  ])

  return Response.json({ ok: true })
}
