import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

type Props = { daycareId: string; teacherId: string; onCreated: (dogId: string) => void }

export default function DogForm({ daycareId, teacherId, onCreated }: Props) {
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [foodBrand, setFoodBrand] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    setError('')

    const { data: dog, error: dogError } = await supabase
      .from('dogs')
      .insert({ name, breed, food_brand: foodBrand, daycare_id: daycareId })
      .select('id')
      .single()

    if (dogError || !dog) {
      setError('강아지 등록에 실패했어요.')
      setLoading(false)
      return
    }

    const { error: memberError } = await supabase
      .from('memberships')
      .insert({ dog_id: dog.id, teacher_id: teacherId })

    if (memberError) {
      setError('강아지 등록 중 오류가 발생했어요.')
      setLoading(false)
      return
    }

    onCreated(dog.id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-[#111111]">강아지 등록</h2>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="이름 *" className="rounded-[8px]" />
      <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder="견종" className="rounded-[8px]" />
      <Input value={foodBrand} onChange={e => setFoodBrand(e.target.value)} placeholder="주 사료 브랜드" className="rounded-[8px]" />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={!name.trim() || loading} className="rounded-[30px] bg-[#111111] text-white">
        {loading ? '등록 중...' : '강아지 등록'}
      </Button>
    </div>
  )
}
