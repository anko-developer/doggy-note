import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle } from '@/hooks/useAuth'
import { acceptInvite } from '@/hooks/useInvite'

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
      .then(() => { setStatus('done'); setTimeout(() => navigate('/feed'), 1500) })
      .catch((e: Error) => { setStatus('error'); setErrorMsg(e.message) })
  }, [user, token, status, navigate])

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <p className="text-xl font-bold text-[#211922]">🐾 초대 링크를 받으셨군요!</p>
        <p className="text-sm text-[#62625b] text-center">Google 계정으로 로그인하면 강아지와 연결돼요.</p>
        <button
          onClick={() => {
            if (token) localStorage.setItem('pendingInviteToken', token)
            signInWithGoogle()
          }}
          className="rounded-[16px] bg-[#e60023] px-8 py-3 text-white font-medium">
          Google로 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      {status === 'accepting' && <p className="text-[#91918c]">강아지와 연결 중...</p>}
      {status === 'done' && <p className="text-xl">🎉 연결 완료! 피드로 이동합니다.</p>}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-red-500 mb-2">연결에 실패했어요</p>
          <p className="text-sm text-[#62625b]">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
