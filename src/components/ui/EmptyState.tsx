interface EmptyStateProps {
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-secondary mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="w-full sm:w-auto px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-hover active:bg-primary-hover transition-colors cursor-pointer"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
