import { MOOD_LABELS, type Mood } from '@/types/domain'
import { cn } from '@/lib/utils'

type Props = { mood: Mood; selected: boolean; onSelect: (mood: Mood) => void }

export default function MoodChip({ mood, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(mood)}
      className={cn(
        'rounded-[30px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#111111] text-white'
          : 'bg-[#F5F5F5] text-[#111111]'
      )}
    >
      {MOOD_LABELS[mood]}
    </button>
  )
}
