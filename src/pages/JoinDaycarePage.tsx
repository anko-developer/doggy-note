import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import JoinDaycare from '@/components/onboarding/JoinDaycare'
import CreateDaycare from '@/components/onboarding/CreateDaycare'

type Mode = 'choose' | 'join' | 'create'

export default function JoinDaycarePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('choose')

  if (loading) return <div className="p-4">Loading...</div>
  if (!user) { navigate('/onboarding', { replace: true }); return null }

  if (mode === 'choose') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <h2 className="text-2xl font-bold text-[#111111]">유치원 설정</h2>
        <p className="text-sm text-[#707072] text-center">원장님이신가요, 아니면 직원으로 합류하시나요?</p>
        <button
          onClick={() => setMode('create')}
          className="w-full max-w-xs rounded-[30px] bg-[#111111] py-3 text-white font-medium"
        >
          새 유치원 만들기
        </button>
        <button
          onClick={() => setMode('join')}
          className="w-full max-w-xs rounded-[30px] border border-[#CACACB] py-3 text-[#111111] font-medium"
        >
          코드로 합류하기
        </button>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <CreateDaycare userId={user.id} onCreated={() => navigate('/', { replace: true })} />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <JoinDaycare userId={user.id} onJoined={() => navigate('/', { replace: true })} />
    </div>
  )
}
