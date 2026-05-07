import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle } from '@/hooks/useAuth'
import { acceptInvite } from '@/hooks/useInvite'
import { supabase } from '@/lib/supabase'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user || !token || status !== 'idle') return
    setStatus('accepting')
    acceptInvite(token)
      .then(async () => {
        // 초대 수락한 사용자에게 guardian 프로필이 없으면 생성
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
        if (!profile) {
          await supabase
            .from('user_profiles')
            .insert({ id: user.id, role: 'guardian', daycare_id: null, display_name: user.user_metadata?.full_name ?? user.email ?? '' })
        }
        setStatus('done')
        setTimeout(() => navigate('/feed'), 1500)
      })
      .catch((e: Error) => { setStatus('error'); setErrorMsg(e.message) })
  }, [user, token, status, navigate])

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <p className="text-xl font-bold text-[#111111]">🐾 초대 링크를 받으셨군요!</p>
        <p className="text-sm text-[#707072] text-center">Google 계정으로 로그인하면 강아지와 연결돼요.</p>
        <button
          onClick={() => {
            if (token) localStorage.setItem('pendingInviteToken', token)
            signInWithGoogle()
          }}
          className="rounded-[30px] bg-[#111111] px-8 py-3 text-white font-medium">
          Google로 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      {status === 'accepting' && <p className="text-[#9E9EA0]">강아지와 연결 중...</p>}
      {status === 'done' && <p className="text-xl">🎉 연결 완료! 피드로 이동합니다.</p>}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-red-500 mb-2">연결에 실패했어요</p>
          <p className="text-sm text-[#707072]">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
