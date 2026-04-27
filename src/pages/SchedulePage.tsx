import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function SchedulePage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: guardianDog } = useQuery({
    queryKey: ['guardian-dog', user?.id],
    enabled: !!user && role === 'guardian',
    queryFn: async () => {
      const { data } = await (supabase as any).from('dogs').select('daycare_id').eq('owner_id', user!.id).limit(1).single()
      return data
    },
  })

  const daycareId = role === 'guardian' ? guardianDog?.daycare_id : profile?.daycare_id

  const { data: schedules } = useQuery({
    queryKey: ['schedules', daycareId],
    enabled: !!daycareId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('schedules')
        .select('*')
        .eq('daycare_id', daycareId!)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date')
      return data ?? []
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('schedules').insert({
        daycare_id: daycareId!,
        title,
        description: desc,
        event_date: date,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      setTitle(''); setDate(''); setDesc(''); setIsAdding(false)
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#211922]">일정표</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm" className="rounded-[16px]">
            {isAdding ? '취소' : '+ 추가'}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#f6f6f3] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" className="rounded-[16px]" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-[16px]" />
          <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="상세 내용 (선택)" className="rounded-[16px]" />
          <Button onClick={() => create.mutate()} disabled={!title || !date || create.isPending}
            className="rounded-[16px] bg-[#e60023] text-white">
            저장
          </Button>
        </div>
      )}

      {schedules !== undefined && schedules.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#f6f6f3] py-14 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-bold text-[#211922]">예정된 일정이 없어요</p>
          <p className="text-sm text-[#91918c] mt-1">
            {role === 'teacher' ? '일정을 추가해보세요.' : '선생님이 일정을 등록하면 여기에 표시돼요.'}
          </p>
        </div>
      )}

      {(schedules ?? []).map((s: any) => (
        <div key={s.id} className="rounded-[20px] border border-[#e5e5e0] bg-white p-4">
          <p className="text-xs text-[#91918c] mb-1">
            {new Date(s.event_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <p className="font-bold text-[#211922]">{s.title}</p>
          {s.description && <p className="text-sm text-[#62625b] mt-1">{s.description}</p>}
        </div>
      ))}
    </div>
  )
}
