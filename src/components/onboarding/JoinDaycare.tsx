import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Props = { userId: string; onJoined: (daycareId: string) => void }

export default function JoinDaycare({ userId, onJoined }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    setError('')
    const { data: daycare } = await (supabase as any)
      .from('daycares')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single()

    if (!daycare) {
      setError('유치원 코드를 찾을 수 없어요.')
      setLoading(false)
      return
    }

    await (supabase as any)
      .from('user_profiles')
      .update({ daycare_id: daycare.id })
      .eq('id', userId)

    onJoined(daycare.id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-[#111111]">유치원 코드 입력</h2>
      <p className="text-sm text-[#707072]">원장님께 받은 6자리 코드를 입력해 주세요.</p>
      <Input
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder="ABCD12"
        maxLength={6}
        className="text-center text-2xl tracking-widest rounded-[16px]"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        onClick={handleJoin}
        disabled={code.length !== 6 || loading}
        className="rounded-[16px] bg-[#111111] text-white"
      >
        {loading ? '확인 중...' : '합류하기'}
      </Button>
    </div>
  )
}
