import type { Env } from '../../types'

interface BulkCreateBody {
  deckId: number
  cards: { front: string; back: string }[]
}

const MAX_CARDS = 200

export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: BulkCreateBody
  try {
    body = await context.request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.deckId || !Array.isArray(body.cards) || body.cards.length === 0) {
    return Response.json(
      { error: 'deckId and a non-empty cards array are required' },
      { status: 400 },
    )
  }

  if (body.cards.length > MAX_CARDS) {
    return Response.json(
      { error: `Too many cards. Maximum is ${MAX_CARDS} per request.` },
      { status: 400 },
    )
  }

  // Validate each card has front and back
  for (let i = 0; i < body.cards.length; i++) {
    const card = body.cards[i]
    if (!card.front?.trim() || !card.back?.trim()) {
      return Response.json(
        { error: `Card at index ${i} is missing front or back text` },
        { status: 400 },
      )
    }
  }

  // Verify deck exists
  const deck = await context.env.DB.prepare(
    'SELECT id FROM decks WHERE id = ?',
  )
    .bind(body.deckId)
    .first()

  if (!deck) {
    return Response.json({ error: 'Deck not found' }, { status: 404 })
  }

  // Construct FSRS defaults server-side (same as a new empty card)
  const now = new Date().toISOString()
  const statements = body.cards.map((card) =>
    context.env.DB.prepare(
      `INSERT INTO cards (deck_id, front, back, due, stability, difficulty, elapsed_days, scheduled_days, learning_steps, reps, lapses, state, last_review)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(
      body.deckId,
      card.front.trim(),
      card.back.trim(),
      now,
      0, // stability
      0, // difficulty
      0, // elapsed_days
      0, // scheduled_days
      0, // learning_steps
      0, // reps
      0, // lapses
      0, // state (New)
      null, // last_review
    ),
  )

  await context.env.DB.batch(statements)

  return Response.json({ count: body.cards.length }, { status: 201 })
}
