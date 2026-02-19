import type { CardRecord } from '../../models/types'
import CardItem from './CardItem'

interface CardListProps {
  cards: CardRecord[]
  onEdit: (card: CardRecord) => void
  onDelete: (card: CardRecord) => void
}

export default function CardList({ cards, onEdit, onDelete }: CardListProps) {
  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
