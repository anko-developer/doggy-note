import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDaycareId } from '@/hooks/useProfile'
import type { MealPlanEntry } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const DAYS: MealPlanEntry['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_KO: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금' }

function getMonday(d = new Date()) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export default function MealPlanPage() {
  const { role } = useAuth()
  const qc = useQueryClient()
  const daycareId = useDaycareId()
  const weekStart = getMonday()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MealPlanEntry[]>(
    DAYS.map(day => ({ day, morning: '', lunch: '', snack: '' }))
  )
  const [submitError, setSubmitError] = useState('')

  const { data: plan } = useQuery({
    queryKey: ['meal-plan', daycareId, weekStart],
    enabled: !!daycareId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('daycare_id', daycareId!)
        .eq('week_start', weekStart)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('meal_plans').upsert({
        daycare_id: daycareId!,
        week_start: weekStart,
        entries: draft,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] })
      setEditing(false)
      setSubmitError('')
    },
    onError: () => setSubmitError('식단 저장에 실패했어요. 다시 시도해주세요.'),
  })

  const entries: MealPlanEntry[] = (plan?.entries as MealPlanEntry[]) ?? []

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">이번 주 식단</h1>
        {role === 'teacher' && (
          <Button onClick={() => { setDraft(entries.length ? entries : draft); setEditing(!editing) }}
            variant="outline" size="sm" className="rounded-[30px]">
            {editing ? '취소' : '수정'}
          </Button>
        )}
      </div>

      {DAYS.map(day => {
        const e = entries.find(e => e.day === day) ?? { day, morning: '-', lunch: '-', snack: '-' }
        const d = draft.find(e => e.day === day)!
        return (
          <div key={day} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
            <p className="font-bold text-[#111111] mb-2">{DAY_KO[day]}요일</p>
            {editing ? (
              <div className="flex flex-col gap-2">
                {(['morning', 'lunch', 'snack'] as const).map(meal => (
                  <Input key={meal} value={d[meal]}
                    onChange={ev => setDraft(prev => prev.map(p => p.day === day ? { ...p, [meal]: ev.target.value } : p))}
                    placeholder={meal === 'morning' ? '아침' : meal === 'lunch' ? '점심' : '간식'}
                    className="rounded-[8px] text-sm" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-sm text-[#707072]">
                <span>🌅 {e.morning}</span>
                <span>☀️ {e.lunch}</span>
                <span>🍪 {e.snack}</span>
              </div>
            )}
          </div>
        )
      })}

      {editing && (
        <>
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <Button onClick={() => save.mutate()} disabled={save.isPending}
            className="rounded-[30px] bg-[#111111] text-white">
            {save.isPending ? '저장 중...' : '식단 저장'}
          </Button>
        </>
      )}
    </div>
  )
}
