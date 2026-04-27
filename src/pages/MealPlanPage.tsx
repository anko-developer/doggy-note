import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
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
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const weekStart = getMonday()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MealPlanEntry[]>(
    DAYS.map(day => ({ day, morning: '', lunch: '', snack: '' }))
  )

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: plan } = useQuery({
    queryKey: ['meal-plan', profile?.daycare_id, weekStart],
    enabled: !!profile?.daycare_id,
    queryFn: async () => {
      const { data } = await (supabase as any).from('meal_plans').select('*')
        .eq('daycare_id', profile!.daycare_id!).eq('week_start', weekStart).single()
      return data
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('meal_plans').upsert({
        daycare_id: profile!.daycare_id!,
        week_start: weekStart,
        entries: draft,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] })
      setEditing(false)
    },
  })

  const entries: MealPlanEntry[] = (plan?.entries as MealPlanEntry[]) ?? []

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">이번 주 식단</h1>
        {role === 'teacher' && (
          <Button onClick={() => { setDraft(entries.length ? entries : draft); setEditing(!editing) }}
            variant="outline" size="sm" className="rounded-[16px]">
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
                    className="rounded-[16px] text-sm" />
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
        <Button onClick={() => save.mutate()} disabled={save.isPending}
          className="rounded-[16px] bg-[#111111] text-white">
          {save.isPending ? '저장 중...' : '식단 저장'}
        </Button>
      )}
    </div>
  )
}
