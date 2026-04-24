import { MEALS_LABELS, type MealsEaten } from '@/types/domain'
import { cn } from '@/lib/utils'

type Props = { meal: MealsEaten; selected: boolean; onSelect: (meal: MealsEaten) => void }

export default function MealChip({ meal, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(meal)}
      className={cn(
        'rounded-[16px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#e60023] text-white'
          : 'bg-[#e5e5e0] text-[#211922]'
      )}
    >
      {MEALS_LABELS[meal]}
    </button>
  )
}
