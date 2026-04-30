import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDaycareId } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useMinLoading } from '@/hooks/useMinLoading'

export default function AnnouncementsPage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const daycareId = useDaycareId()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isWriting, setIsWriting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const { data: announcements, isLoading: announcementsLoading } = useQuery({
    queryKey: ['announcements', daycareId],
    enabled: !!daycareId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('daycare_id', daycareId!)
        .order('published_at', { ascending: false })
      if (error) throw error
      return data
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('announcements').insert({
        daycare_id: daycareId!,
        teacher_id: user!.id,
        title,
        body,
      })
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setTitle('')
      setBody('')
      setIsWriting(false)
      setSubmitError('')
    },
    onError: () => setSubmitError('공지 등록에 실패했어요. 다시 시도해주세요.'),
  })

  const isLoading = useMinLoading(announcementsLoading, !!announcements)

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">공지사항</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsWriting(!isWriting)} variant="outline" size="sm" className="rounded-[30px]">
            {isWriting ? '취소' : '작성'}
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#F5F5F5] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="rounded-[8px]" />
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용" className="rounded-[8px] min-h-[100px]" />
          {submitError && <p className="text-sm text-red-500">{submitError}</p>}
          <Button onClick={() => create.mutate()} disabled={!title || !body || create.isPending}
            className="rounded-[30px] bg-[#111111] text-white">
            {create.isPending ? '저장 중...' : '공지 올리기'}
          </Button>
        </div>
      )}

      {isLoading && !isWriting && [0, 1, 2].map(i => (
        <div key={i} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
          <Skeleton className="h-3 w-16 mb-2" />
          <Skeleton className="h-5 w-40 mb-2" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      ))}

      {!isLoading && announcements !== undefined && announcements.length === 0 && !isWriting && (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#F5F5F5] py-14 text-center">
          <p className="text-4xl mb-3">📢</p>
          <p className="font-bold text-[#111111]">공지사항이 없어요</p>
          <p className="text-sm text-[#9E9EA0] mt-1">
            {role === 'teacher' ? '새 공지를 작성해보세요.' : '선생님의 공지를 기다리고 있어요.'}
          </p>
        </div>
      )}

      {(announcements ?? []).map((a) => (
        <div key={a.id} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
          <p className="text-xs text-[#9E9EA0] mb-1">
            {new Date(a.published_at ?? a.created_at ?? '').toLocaleDateString('ko-KR')}
          </p>
          <p className="font-bold text-[#111111] mb-1">{a.title}</p>
          <p className="text-sm text-[#707072] whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
    </div>
  )
}
