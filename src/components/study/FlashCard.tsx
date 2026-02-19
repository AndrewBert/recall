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
      className="flip-card w-full max-w-xl mx-auto cursor-pointer"
      style={{ height: '280px' }}
      onClick={onFlip}
    >
      <div className={`flip-card-inner ${isFlipped ? 'flipped' : ''}`}>
        <div className="flip-card-front bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
            Front
          </p>
          <p className="text-xl text-gray-900 text-center whitespace-pre-wrap">
            {front}
          </p>
          {!isFlipped && (
            <p className="text-xs text-gray-400 mt-6">
              Click or press Space to reveal
            </p>
          )}
        </div>
        <div className="flip-card-back bg-white rounded-xl border border-gray-200 shadow-sm p-8 flex flex-col items-center justify-center">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">
            Back
          </p>
          <p className="text-xl text-gray-900 text-center whitespace-pre-wrap">
            {back}
          </p>
        </div>
      </div>
    </div>
  )
}
