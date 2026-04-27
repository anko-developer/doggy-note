import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Mood, MealsEaten, TrainingEntry } from '@/types/domain'

export type ReportDraft = {
  dog_id: string
  teacher_id: string
  date: string
  meals_eaten: MealsEaten
  food_brand_today: string
  walk_count: number
  walk_distance_km: number
  training_log: TrainingEntry[]
  mood: Mood
  teacher_note: string
}

export function useTodayReport(dogId: string) {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['report', dogId, today],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('daily_reports')
        .select('*')
        .eq('dog_id', dogId)
        .eq('date', today)
        .single()
      return data
    },
  })
}

export function useUpsertReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (draft: ReportDraft & { id?: string }) => {
      const { id, ...fields } = draft
      if (id) {
        const { data, error } = await (supabase as any).from('daily_reports').update(fields).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const { data, error } = await (supabase as any).from('daily_reports').insert(fields).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['report', data.dog_id] })
    },
  })
}

export function usePublishReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await (supabase as any)
        .from('daily_reports')
        .update({ published_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['report', data.dog_id] })
    },
  })
}
