import { useState, useEffect, useCallback } from 'react'
import {
  hasLegacyData,
  readLegacyData,
  migrateToApi,
  deleteLegacyDatabase,
  dismissMigration,
} from '../../services/migrationService'
import type { MigrationResult } from '../../services/migrationService'
import { queryClient } from '../../queryClient'

type BannerState =
  | { phase: 'checking' }
  | { phase: 'idle' }
  | { phase: 'confirming' }
  | { phase: 'migrating'; done: number; total: number }
  | { phase: 'success'; result: MigrationResult }
  | { phase: 'error'; message: string }
  | { phase: 'hidden' }

interface MigrationBannerProps {
  hasExistingData: boolean
}

export default function MigrationBanner({ hasExistingData }: MigrationBannerProps) {
  const [state, setState] = useState<BannerState>({ phase: 'checking' })

  useEffect(() => {
    hasLegacyData().then((found) => {
      setState(found ? { phase: 'idle' } : { phase: 'hidden' })
    })
  }, [])

  const startMigration = useCallback(async () => {
    setState({ phase: 'migrating', done: 0, total: 0 })

    try {
      const data = await readLegacyData()
      const result = await migrateToApi(data, (done, total) => {
        setState({ phase: 'migrating', done, total })
      })

      await deleteLegacyDatabase()
      queryClient.invalidateQueries()
      setState({ phase: 'success', result })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setState({ phase: 'error', message })
    }
  }, [])

  const handleDismiss = useCallback(() => {
    dismissMigration()
    setState({ phase: 'hidden' })
  }, [])

  if (state.phase === 'checking' || state.phase === 'hidden') return null

  return (
    <div className="mb-6 rounded-lg bg-indigo-50 border border-indigo-200 p-4">
      {state.phase === 'idle' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-indigo-800 flex-1">
            We found local data from a previous version. Migrate it to the cloud to keep your decks and cards.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (hasExistingData) {
                  setState({ phase: 'confirming' })
                } else {
                  startMigration()
                }
              }}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors cursor-pointer"
            >
              Migrate to cloud
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-indigo-600 text-sm hover:text-indigo-800 active:text-indigo-800 transition-colors cursor-pointer"
              aria-label="Dismiss migration banner"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {state.phase === 'confirming' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-indigo-800">
            You already have decks in the cloud. Migrating will create additional decks from your local data. Continue?
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={startMigration}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors cursor-pointer"
            >
              Yes, migrate
            </button>
            <button
              onClick={() => setState({ phase: 'idle' })}
              className="w-full sm:w-auto px-4 py-2 text-indigo-700 bg-indigo-100 text-sm rounded-lg hover:bg-indigo-200 active:bg-indigo-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.phase === 'migrating' && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-indigo-800">
            Migrating...{' '}
            {state.total > 0
              ? `(${state.done}/${state.total} cards)`
              : 'preparing...'}
          </p>
          {state.total > 0 && (
            <div className="w-full bg-indigo-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all"
                style={{ width: `${(state.done / state.total) * 100}%` }}
              />
            </div>
          )}
        </div>
      )}

      {state.phase === 'success' && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-sm text-green-800 flex-1">
            Migration complete! {state.result.decksCreated} {state.result.decksCreated === 1 ? 'deck' : 'decks'} and{' '}
            {state.result.cardsCreated} {state.result.cardsCreated === 1 ? 'card' : 'cards'} migrated.
          </p>
          <button
            onClick={() => setState({ phase: 'hidden' })}
            className="px-3 py-2 text-green-700 text-sm hover:text-green-900 active:text-green-900 transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {state.phase === 'error' && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-red-800">
            Migration failed: {state.message}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={startMigration}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 active:bg-indigo-700 transition-colors cursor-pointer"
            >
              Retry
            </button>
            <button
              onClick={handleDismiss}
              className="w-full sm:w-auto px-4 py-2 text-indigo-700 bg-indigo-100 text-sm rounded-lg hover:bg-indigo-200 active:bg-indigo-200 transition-colors cursor-pointer"
            >
              Skip
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
