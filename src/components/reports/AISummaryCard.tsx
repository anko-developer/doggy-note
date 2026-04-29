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
  onBeforeGenerate?: () => Promise<void>
}

export default function AISummaryCard({ reportId, existingSummary, failed, dogName, reportData, onBeforeGenerate }: Props) {
  const [summary, setSummary] = useState(existingSummary)
  const [isFailed, setIsFailed] = useState(failed)
  const qc = useQueryClient()

  const generate = useMutation({
    mutationFn: async () => {
      if (onBeforeGenerate) await onBeforeGenerate()
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { report_id: reportId, dog_name: dogName, ...reportData },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data.summary as string
    },
    onSuccess: (text) => {
      // DB 저장은 Edge Function이 처리 — 로컬 state만 업데이트
      setSummary(text)
      setIsFailed(false)
      qc.invalidateQueries({ queryKey: ['report'] })
    },
    onError: () => {
      // DB 실패 기록도 Edge Function이 처리
      setIsFailed(true)
    },
  })

  return (
    <div className="rounded-[12px] border border-[#CACACB] bg-[#FAFAFA] p-4">
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
        <p className="text-sm text-red-500">
          요약 생성에 실패했어요.{' '}
          <button onClick={() => generate.mutate()} className="underline">재시도</button>
        </p>
      )}
      {summary && !generate.isPending && (
        <p className="text-sm text-[#111111] leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
