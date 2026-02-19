import type { Env } from '../../types'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const id = Number(context.params.id)
  const row = await context.env.DB.prepare('SELECT * FROM decks WHERE id = ?').bind(id).first()

  if (!row) {
    return Response.json({ error: 'Deck not found' }, { status: 404 })
  }

  return Response.json({
    deck: {
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    },
  })
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const id = Number(context.params.id)
  let body: { name?: string; description?: string }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const existing = await context.env.DB.prepare('SELECT * FROM decks WHERE id = ?').bind(id).first()
  if (!existing) {
    return Response.json({ error: 'Deck not found' }, { status: 404 })
  }

  const name = body.name?.trim() ?? existing.name as string
  const description = body.description?.trim() ?? existing.description as string
  const now = new Date().toISOString()

  await context.env.DB.prepare(
    'UPDATE decks SET name = ?, description = ?, updated_at = ? WHERE id = ?'
  ).bind(name, description, now, id).run()

  return Response.json({
    deck: {
      id,
      name,
      description,
      createdAt: existing.created_at,
      updatedAt: now,
    },
  })
}

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const id = Number(context.params.id)

  const existing = await context.env.DB.prepare('SELECT id FROM decks WHERE id = ?').bind(id).first()
  if (!existing) {
    return Response.json({ error: 'Deck not found' }, { status: 404 })
  }

  // D1 doesn't enforce PRAGMA foreign_keys, so cascade manually
  await context.env.DB.batch([
    context.env.DB.prepare(
      'DELETE FROM review_logs WHERE card_id IN (SELECT id FROM cards WHERE deck_id = ?)'
    ).bind(id),
    context.env.DB.prepare('DELETE FROM cards WHERE deck_id = ?').bind(id),
    context.env.DB.prepare('DELETE FROM decks WHERE id = ?').bind(id),
  ])

  return Response.json({ ok: true })
}
