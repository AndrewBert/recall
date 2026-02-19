import type { Env } from '../../types'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { results } = await context.env.DB.prepare(
    'SELECT * FROM decks ORDER BY created_at DESC'
  ).all()

  const decks = results.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))

  return Response.json({ decks })
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: { name: string; description?: string }
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return Response.json({ error: 'name is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const result = await context.env.DB.prepare(
    'INSERT INTO decks (name, description, created_at, updated_at) VALUES (?, ?, ?, ?)'
  ).bind(body.name.trim(), body.description?.trim() ?? '', now, now).run()

  return Response.json({
    deck: {
      id: result.meta.last_row_id,
      name: body.name.trim(),
      description: body.description?.trim() ?? '',
      createdAt: now,
      updatedAt: now,
    },
  }, { status: 201 })
}
