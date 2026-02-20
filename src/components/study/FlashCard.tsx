interface FlashCardProps {
  front: string
  back: string
  isFlipped: boolean
  onFlip: () => void
}

export default function FlashCard({
  front,
  back,
  isFlipped,
  onFlip,
}: FlashCardProps) {
  return (
    <div
      className="flip-card w-full max-w-xl mx-auto cursor-pointer h-60 sm:h-[280px] active:scale-[0.98] transition-transform"
      onClick={onFlip}
    >
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front bg-surface rounded-xl border border-border shadow-sm p-8 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-wide text-tertiary mb-3">
            Front
          </p>
          <p className="text-xl text-body text-center whitespace-pre-wrap">
            {front}
          </p>
          {!isFlipped && (
            <p className="text-xs text-tertiary mt-6">
              <span className="sm:hidden">Tap to reveal</span>
              <span className="hidden sm:inline">Click or press Space to reveal</span>
            </p>
          )}
        </div>
        <div className="flip-card-back bg-surface rounded-xl border border-border shadow-sm p-8 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-wide text-tertiary mb-3">
            Back
          </p>
          <p className="text-xl text-body text-center whitespace-pre-wrap">
            {back}
          </p>
        </div>
      </div>
    </div>
  )
}
