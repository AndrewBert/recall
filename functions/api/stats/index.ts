import type { Env } from '../../types'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const now = new Date()
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1))
  const weekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7))
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate()))

  const todayStartISO = todayStart.toISOString()
  const todayEndISO = todayEnd.toISOString()
  const weekEndISO = weekEnd.toISOString()
  const monthEndISO = monthEnd.toISOString()

  const results = await context.env.DB.batch([
    // 0: Today's reviews + rating breakdown
    context.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as again,
        SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as hard,
        SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as easy
      FROM review_logs
      WHERE review >= ?
    `).bind(todayStartISO),

    // 1: Card state breakdown
    context.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN state = 0 THEN 1 ELSE 0 END) as new_cards,
        SUM(CASE WHEN state = 1 THEN 1 ELSE 0 END) as learning_cards,
        SUM(CASE WHEN state IN (2, 3) THEN 1 ELSE 0 END) as review_cards
      FROM cards
    `),

    // 2: Total reviews all-time
    context.env.DB.prepare(`SELECT COUNT(*) as total FROM review_logs`),

    // 3: Distinct review dates for streak (bounded)
    context.env.DB.prepare(`
      SELECT DISTINCT DATE(review) as review_date
      FROM review_logs
      ORDER BY review_date DESC
      LIMIT 365
    `),

    // 4: Avg FSRS metrics for review-state cards
    context.env.DB.prepare(`
      SELECT AVG(stability) as avg_stability, AVG(difficulty) as avg_difficulty
      FROM cards
      WHERE state IN (2, 3)
    `),

    // 5: True retention (pass rate on review-state cards)
    context.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN rating > 1 THEN 1 ELSE 0 END) as passed
      FROM review_logs
      WHERE state IN (2, 3)
    `),

    // 6: Upcoming due counts (end of day/week/month boundaries)
    context.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN due <= ? THEN 1 ELSE 0 END) as due_today,
        SUM(CASE WHEN due <= ? THEN 1 ELSE 0 END) as due_week,
        SUM(CASE WHEN due <= ? THEN 1 ELSE 0 END) as due_month
      FROM cards
    `).bind(todayEndISO, weekEndISO, monthEndISO),
  ])

  // Extract results
  const todayRow = results[0].results[0] as Record<string, number | null>
  const cardsRow = results[1].results[0] as Record<string, number | null>
  const totalReviewsRow = results[2].results[0] as Record<string, number | null>
  const reviewDates = results[3].results as Array<{ review_date: string }>
  const fsrsRow = results[4].results[0] as Record<string, number | null>
  const retentionRow = results[5].results[0] as Record<string, number | null>
  const upcomingRow = results[6].results[0] as Record<string, number | null>

  // Calculate streak
  const streak = calculateStreak(reviewDates.map(r => r.review_date), todayStart)

  // Calculate true retention
  const retentionTotal = retentionRow.total ?? 0
  const retentionPassed = retentionRow.passed ?? 0
  const trueRetention = retentionTotal > 0
    ? Math.round((retentionPassed / retentionTotal) * 1000) / 10
    : null

  return Response.json({
    today: {
      reviewsCompleted: todayRow.total ?? 0,
      again: todayRow.again ?? 0,
      hard: todayRow.hard ?? 0,
      good: todayRow.good ?? 0,
      easy: todayRow.easy ?? 0,
    },
    overview: {
      totalCards: cardsRow.total ?? 0,
      newCards: cardsRow.new_cards ?? 0,
      learningCards: cardsRow.learning_cards ?? 0,
      reviewCards: cardsRow.review_cards ?? 0,
      totalReviews: totalReviewsRow.total ?? 0,
      streak,
    },
    retention: {
      trueRetention,
      avgStability: fsrsRow.avg_stability != null
        ? Math.round(fsrsRow.avg_stability * 10) / 10
        : null,
      avgDifficulty: fsrsRow.avg_difficulty != null
        ? Math.round(fsrsRow.avg_difficulty * 10) / 10
        : null,
    },
    upcoming: {
      dueToday: upcomingRow.due_today ?? 0,
      dueWeek: upcomingRow.due_week ?? 0,
      dueMonth: upcomingRow.due_month ?? 0,
    },
  })
}

/** Walk backward from today through distinct review dates counting consecutive days. */
function calculateStreak(sortedDates: string[], today: Date): number {
  if (sortedDates.length === 0) return 0

  const todayStr = today.toISOString().slice(0, 10)
  const yesterdayDate = new Date(today)
  yesterdayDate.setUTCDate(yesterdayDate.getUTCDate() - 1)
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10)

  // Streak must start from today or yesterday
  if (sortedDates[0] !== todayStr && sortedDates[0] !== yesterdayStr) {
    return 0
  }

  let streak = 0
  const expectedDate = new Date(today)

  // If most recent review is yesterday, start from yesterday
  if (sortedDates[0] !== todayStr) {
    expectedDate.setUTCDate(expectedDate.getUTCDate() - 1)
  }

  for (const dateStr of sortedDates) {
    const expectedStr = expectedDate.toISOString().slice(0, 10)
    if (dateStr === expectedStr) {
      streak++
      expectedDate.setUTCDate(expectedDate.getUTCDate() - 1)
    } else if (dateStr < expectedStr) {
      // Gap found, streak broken
      break
    }
    // dateStr > expectedStr shouldn't happen since sorted DESC, but skip if so
  }

  return streak
}
