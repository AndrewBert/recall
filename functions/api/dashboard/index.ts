import type { Env } from '../../types'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const now = new Date().toISOString()

  const { results } = await context.env.DB.prepare(`
    SELECT d.*,
      COUNT(c.id) as card_count,
      SUM(CASE WHEN c.due <= ? THEN 1 ELSE 0 END) as due_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `).bind(now).all()

  const decks = results.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    cardCount: row.card_count,
    dueCount: row.due_count ?? 0,
  }))

  return Response.json({ decks })
}
