import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MOOD_LABELS, MEALS_LABELS } from '@/types/domain'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type Report = {
  id: string
  mood: string
  meals_eaten: string
  walk_count: number
  walk_distance_km: number
  ai_summary: string | null
  teacher_note: string | null
  confirmed_at: string | null
  published_at: string | null
  date: string
  food_brand_today: string | null
}

type Props = { report: Report }

export default function ReportCard({ report }: Props) {
  const qc = useQueryClient()
  const confirmed = !!report.confirmed_at

  const confirm = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('daily_reports')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('id', report.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })

  return (
    <div className={cn(
      'rounded-[20px] border border-[#e5e5e0] p-4',
      confirmed ? 'bg-[#e5e5e0]' : 'bg-white'
    )}>
      <p className="mb-1 text-xs text-[#91918c]">{report.date}</p>
      <p className="mb-3 text-sm font-bold text-[#211922]">
        {MOOD_LABELS[report.mood as keyof typeof MOOD_LABELS] ?? report.mood}
        {' · '}
        {MEALS_LABELS[report.meals_eaten as keyof typeof MEALS_LABELS] ?? report.meals_eaten}
      </p>

      {report.ai_summary && (
        <p className="mb-3 text-sm text-[#211922] leading-relaxed">{report.ai_summary}</p>
      )}

      <div className="flex gap-4 text-xs text-[#62625b]">
        <span>🚶 {report.walk_count}회 {report.walk_distance_km}km</span>
        {report.food_brand_today && <span>🍽 {report.food_brand_today}</span>}
      </div>

      {report.teacher_note && (
        <p className="mt-2 text-xs text-[#62625b] italic">"{report.teacher_note}"</p>
      )}

      {!confirmed && (
        <Button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending}
          className="mt-4 w-full rounded-[16px] bg-[#e60023] text-white"
        >
          확인했어요 ✓
        </Button>
      )}
      {confirmed && (
        <p className="mt-3 text-center text-xs text-[#91918c]">확인 완료 ✓</p>
      )}
    </div>
  )
}
