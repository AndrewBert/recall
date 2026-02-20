import { useStats } from '../hooks/useStats'
import { formatInterval } from '../lib/utils'

function StatCard({ value, label, colorClass }: { value: string | number; label: string; colorClass: string }) {
  const [bg, textBold, textSm] = colorClass.split(' ')
  return (
    <div className={`${bg} rounded-lg p-3`}>
      <div className={`text-lg font-bold ${textBold}`}>{value}</div>
      <div className={`text-xs ${textSm}`}>{label}</div>
    </div>
  )
}

export default function StatsPage() {
  const { data: stats, isLoading } = useStats()

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">Failed to load stats.</div>
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Statistics</h1>

      {/* Today */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Today</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatCard
            value={stats.today.reviewsCompleted}
            label="Reviews"
            colorClass="bg-indigo-50 text-indigo-600 text-indigo-500"
          />
          <StatCard
            value={stats.today.again}
            label="Again"
            colorClass="bg-red-50 text-red-600 text-red-500"
          />
          <StatCard
            value={stats.today.hard}
            label="Hard"
            colorClass="bg-orange-50 text-orange-600 text-orange-500"
          />
          <StatCard
            value={stats.today.good}
            label="Good"
            colorClass="bg-green-50 text-green-600 text-green-500"
          />
          <StatCard
            value={stats.today.easy}
            label="Easy"
            colorClass="bg-blue-50 text-blue-600 text-blue-500"
          />
        </div>
      </section>

      {/* Overview */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Overview</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            value={stats.overview.totalCards}
            label="Total Cards"
            colorClass="bg-gray-50 text-gray-700 text-gray-500"
          />
          <StatCard
            value={stats.overview.newCards}
            label="New"
            colorClass="bg-sky-50 text-sky-600 text-sky-500"
          />
          <StatCard
            value={stats.overview.learningCards}
            label="Learning"
            colorClass="bg-amber-50 text-amber-600 text-amber-500"
          />
          <StatCard
            value={stats.overview.reviewCards}
            label="Review"
            colorClass="bg-emerald-50 text-emerald-600 text-emerald-500"
          />
          <StatCard
            value={stats.overview.totalReviews}
            label="Total Reviews"
            colorClass="bg-gray-50 text-gray-700 text-gray-500"
          />
          <StatCard
            value={stats.overview.streak > 0 ? `${stats.overview.streak}d` : '0'}
            label="Streak"
            colorClass="bg-purple-50 text-purple-600 text-purple-500"
          />
        </div>
      </section>

      {/* Retention */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Retention</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            value={stats.retention.trueRetention != null ? `${stats.retention.trueRetention}%` : '--'}
            label="True Retention"
            colorClass="bg-teal-50 text-teal-600 text-teal-500"
          />
          <StatCard
            value={stats.retention.avgStability != null ? formatInterval(stats.retention.avgStability) : '--'}
            label="Avg Stability"
            colorClass="bg-cyan-50 text-cyan-600 text-cyan-500"
          />
          <StatCard
            value={stats.retention.avgDifficulty != null ? stats.retention.avgDifficulty.toFixed(1) : '--'}
            label="Avg Difficulty"
            colorClass="bg-violet-50 text-violet-600 text-violet-500"
          />
        </div>
      </section>

      {/* Upcoming */}
      <section>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">Upcoming</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard
            value={stats.upcoming.dueToday}
            label="Due Today"
            colorClass="bg-rose-50 text-rose-600 text-rose-500"
          />
          <StatCard
            value={stats.upcoming.dueWeek}
            label="Due This Week"
            colorClass="bg-orange-50 text-orange-600 text-orange-500"
          />
          <StatCard
            value={stats.upcoming.dueMonth}
            label="Due This Month"
            colorClass="bg-yellow-50 text-yellow-600 text-yellow-500"
          />
        </div>
      </section>
    </div>
  )
}
