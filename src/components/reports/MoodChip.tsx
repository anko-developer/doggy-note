import { MOOD_LABELS, type Mood } from '@/types/domain'
import { cn } from '@/lib/utils'

type Props = { mood: Mood; selected: boolean; onSelect: (mood: Mood) => void }

export default function MoodChip({ mood, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(mood)}
      className={cn(
        'rounded-[16px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#e60023] text-white'
          : 'bg-[#e5e5e0] text-[#211922]'
      )}
    >
      {MOOD_LABELS[mood]}
    </button>
  )
}
