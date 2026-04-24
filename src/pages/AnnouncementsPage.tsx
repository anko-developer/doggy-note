import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function AnnouncementsPage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isWriting, setIsWriting] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements', profile?.daycare_id],
    enabled: !!profile?.daycare_id,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('announcements')
        .select('*')
        .eq('daycare_id', profile!.daycare_id!)
        .order('published_at', { ascending: false })
      return data ?? []
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await (supabase as any).from('announcements').insert({
        daycare_id: profile!.daycare_id!,
        teacher_id: user!.id,
        title,
        body,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setTitle(''); setBody(''); setIsWriting(false)
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#211922]">공지사항</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsWriting(!isWriting)} variant="outline" size="sm" className="rounded-[16px]">
            {isWriting ? '취소' : '작성'}
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#f6f6f3] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="rounded-[16px]" />
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용" className="rounded-[16px] min-h-[100px]" />
          <Button onClick={() => create.mutate()} disabled={!title || !body || create.isPending}
            className="rounded-[16px] bg-[#e60023] text-white">
            {create.isPending ? '저장 중...' : '공지 올리기'}
          </Button>
        </div>
      )}

      {(announcements ?? []).map((a: any) => (
        <div key={a.id} className="rounded-[20px] border border-[#e5e5e0] bg-white p-4">
          <p className="text-xs text-[#91918c] mb-1">
            {new Date(a.published_at).toLocaleDateString('ko-KR')}
          </p>
          <p className="font-bold text-[#211922] mb-1">{a.title}</p>
          <p className="text-sm text-[#62625b] whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
    </div>
  )
}
