/** Format a number of days into a human-readable interval string. */
export function formatInterval(days: number): string {
  if (days < 1) {
    const minutes = Math.round(days * 24 * 60)
    if (minutes < 60) return `${Math.max(1, minutes)}m`
    return `${Math.round(minutes / 60)}h`
  }
  if (days < 30) return `${Math.round(days)}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

/** Format a date as a short relative string (e.g. "2h ago", "in 3d"). */
export function formatRelativeDate(date: Date): string {
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (Math.abs(diffDays) < 1) {
    const diffHours = Math.abs(diffMs) / (1000 * 60 * 60)
    if (diffHours < 1) {
      const diffMinutes = Math.round(Math.abs(diffMs) / (1000 * 60))
      return diffMs < 0 ? `${diffMinutes}m ago` : `in ${diffMinutes}m`
    }
    const hours = Math.round(diffHours)
    return diffMs < 0 ? `${hours}h ago` : `in ${hours}h`
  }

  const days = Math.round(Math.abs(diffDays))
  return diffMs < 0 ? `${days}d ago` : `in ${days}d`
}
