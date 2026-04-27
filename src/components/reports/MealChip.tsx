import { MEALS_LABELS, type MealsEaten } from '@/types/domain'
import { cn } from '@/lib/utils'

type Props = { meal: MealsEaten; selected: boolean; onSelect: (meal: MealsEaten) => void }

export default function MealChip({ meal, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(meal)}
      className={cn(
        'rounded-[30px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#111111] text-white'
          : 'bg-[#F5F5F5] text-[#111111]'
      )}
    >
      {MEALS_LABELS[meal]}
    </button>
  )
}
