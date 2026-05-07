import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDaycareId } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useMinLoading } from '@/hooks/useMinLoading'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

export default function SchedulePage() {
  const { role } = useAuth()
  const qc = useQueryClient()
  const daycareId = useDaycareId()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ['schedules', daycareId],
    enabled: !!daycareId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('daycare_id', daycareId!)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date')
      if (error) throw error
      return data
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schedules').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      setDeleteTarget(null)
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('schedules').insert({
        daycare_id: daycareId!,
        title,
        description: desc,
        event_date: date,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      setTitle('')
      setDate('')
      setDesc('')
      setIsAdding(false)
      setSubmitError('')
    },
    onError: () => setSubmitError('일정 등록에 실패했어요. 다시 시도해주세요.'),
  })

  const isLoading = useMinLoading(schedulesLoading, !!schedules)

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">일정표</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm" className="rounded-[30px]">
            {isAdding ? '취소' : '+ 추가'}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#F5F5F5] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" className="rounded-[8px]" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-[8px]" />
          <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="상세 내용 (선택)" className="rounded-[8px]" />
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <Button onClick={() => create.mutate()} disabled={!title || !date || create.isPending}
            className="rounded-[30px] bg-[#111111] text-white">
            저장
          </Button>
        </div>
      )}

      {isLoading && !isAdding && [0, 1, 2].map(i => (
        <div key={i} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-5 w-36" />
        </div>
      ))}

      {!isLoading && schedules !== undefined && schedules.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#F5F5F5] py-14 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-bold text-[#111111]">예정된 일정이 없어요</p>
          <p className="text-sm text-[#9E9EA0] mt-1">
            {role === 'teacher' ? '일정을 추가해보세요.' : '선생님이 일정을 등록하면 여기에 표시돼요.'}
          </p>
        </div>
      )}

      {(schedules ?? []).map((s) => (
        <div key={s.id} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[#9E9EA0] mb-1">
                {new Date(s.event_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
              </p>
              <p className="font-bold text-[#111111]">{s.title}</p>
              {s.description && <p className="text-sm text-[#707072] mt-1">{s.description}</p>}
            </div>
            {role === 'teacher' && (
              <button
                onClick={() => setDeleteTarget({ id: s.id, title: s.title })}
                className="shrink-0 mt-0.5 text-[#CACACB] hover:text-red-400 transition-colors"
                aria-label="삭제"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>일정 삭제</DialogTitle>
            <DialogDescription>
              &ldquo;{deleteTarget?.title}&rdquo; 일정을 삭제할까요?{"\n"}삭제한 일정은 복구할 수 없어요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="flex-1">
              <Button variant="outline" className="w-full rounded-[12px]">취소</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="flex-1 rounded-[12px]"
              disabled={remove.isPending}
              onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
            >
              {remove.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
