import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { MOOD_LABELS, MEALS_LABELS } from '@/types/domain'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Tables } from '@/types/supabase'

type Report = Tables<'daily_reports'>

type Props = { report: Report }

export default function ReportCard({ report }: Props) {
  const qc = useQueryClient()
  const confirmed = !!report.confirmed_at
  const [error, setError] = useState('')

  const confirm = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('daily_reports')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('id', report.id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      setError('')
    },
    onError: () => setError('확인 처리에 실패했어요.'),
  })

  return (
    <div className={cn(
      'rounded-[20px] border border-[#CACACB] p-4',
      confirmed ? 'bg-[#F5F5F5]' : 'bg-white'
    )}>
      <p className="mb-1 text-xs text-[#9E9EA0]">{report.date}</p>
      <p className="mb-3 text-sm font-bold text-[#111111]">
        {MOOD_LABELS[report.mood as keyof typeof MOOD_LABELS] ?? report.mood}
        {' · '}
        {MEALS_LABELS[report.meals_eaten as keyof typeof MEALS_LABELS] ?? report.meals_eaten}
      </p>

      {report.ai_summary && (
        <p className="mb-3 text-sm text-[#111111] leading-relaxed">{report.ai_summary}</p>
      )}

      <div className="flex gap-4 text-xs text-[#707072]">
        <span>🚶 {report.walk_count}회 {report.walk_distance_km}km</span>
        {report.food_brand_today && <span>🍽 {report.food_brand_today}</span>}
      </div>

      {report.teacher_note && (
        <p className="mt-2 text-xs text-[#707072] italic">"{report.teacher_note}"</p>
      )}

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {!confirmed && (
        <Button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending}
          className="mt-4 w-full rounded-[30px] bg-[#111111] text-white"
        >
          확인했어요 ✓
        </Button>
      )}
      {confirmed && (
        <p className="mt-3 text-center text-xs text-[#9E9EA0]">확인 완료 ✓</p>
      )}
    </div>
  )
}
