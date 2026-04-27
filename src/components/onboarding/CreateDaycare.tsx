import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Props = { userId: string; onCreated: (daycareId: string) => void }

export default function CreateDaycare({ userId, onCreated }: Props) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function generateCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase()
  }

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const daycareId = crypto.randomUUID()
    const joinCode = generateCode()
    const { error: createErr } = await (supabase as any)
      .from('daycares')
      .insert({ id: daycareId, name: name.trim(), join_code: joinCode })

    if (createErr) {
      setError('유치원 생성에 실패했어요. 다시 시도해주세요.')
      setLoading(false)
      return
    }

    await (supabase as any)
      .from('user_profiles')
      .update({ daycare_id: daycareId })
      .eq('id', userId)

    setLoading(false)
    onCreated(daycareId)
  }

  return (
    <div className="flex flex-col gap-4 p-6 w-full max-w-xs">
      <h2 className="text-xl font-bold text-[#111111]">새 유치원 만들기</h2>
      <p className="text-sm text-[#707072]">유치원 이름을 입력하면 입장 코드가 자동으로 생성돼요.</p>
      <Input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="유치원 이름"
        className="rounded-[16px]"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        onClick={handleCreate}
        disabled={!name.trim() || loading}
        className="rounded-[16px] bg-[#111111] text-white"
      >
        {loading ? '생성 중...' : '만들기'}
      </Button>
    </div>
  )
}
