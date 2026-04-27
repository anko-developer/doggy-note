import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { TrainingEntry, Mood, MealsEaten } from '@/types/domain'
import { Button } from '@/components/ui/button'

type ReportData = {
  meals_eaten: MealsEaten
  food_brand: string
  walk_count: number
  walk_distance_km: number
  training_log: TrainingEntry[]
  mood: Mood
  teacher_note: string
}

type Props = {
  reportId: string
  existingSummary?: string
  failed: boolean
  dogName: string
  reportData: ReportData
}

export default function AISummaryCard({ reportId, existingSummary, failed, dogName, reportData }: Props) {
  const [summary, setSummary] = useState(existingSummary)
  const [isFailed, setIsFailed] = useState(failed)
  const qc = useQueryClient()

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).functions.invoke('generate-summary', {
        body: { dog_name: dogName, ...reportData },
      })
      if (error || data?.error) throw new Error(data?.error ?? 'Failed')
      return data.summary as string
    },
    onSuccess: async (text) => {
      setSummary(text)
      setIsFailed(false)
      await (supabase as any).from('daily_reports').update({ ai_summary: text, ai_summary_failed: false }).eq('id', reportId)
      qc.invalidateQueries({ queryKey: ['report'] })
    },
    onError: async () => {
      setIsFailed(true)
      await (supabase as any).from('daily_reports').update({ ai_summary_failed: true }).eq('id', reportId)
    },
  })

  return (
    <div className="rounded-[12px] border border-[#CACACB] bg-[hsla(60,20%,98%,0.5)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium text-[#9E9EA0]">✨ AI 요약</span>
        {!generate.isPending && (
          <Button
            onClick={() => generate.mutate()}
            variant="ghost"
            size="sm"
            className="text-xs text-[#707072]"
          >
            {summary ? '재생성' : '생성하기'}
          </Button>
        )}
      </div>
      {generate.isPending && <p className="text-sm text-[#9E9EA0] animate-pulse">요약 생성 중...</p>}
      {isFailed && !generate.isPending && (
        <p className="text-sm text-red-500">요약 생성에 실패했어요. <button onClick={() => generate.mutate()} className="underline">재시도</button></p>
      )}
      {summary && !generate.isPending && (
        <p className="text-sm text-[#111111] leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
