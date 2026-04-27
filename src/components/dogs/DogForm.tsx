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

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { data: dog, error } = await (supabase as any)
      .from('dogs')
      .insert({ name, breed, food_brand: foodBrand, daycare_id: daycareId })
      .select('id')
      .single()

    if (error || !dog) { setLoading(false); return }

    await (supabase as any).from('memberships').insert({ dog_id: dog.id, teacher_id: teacherId })
    onCreated(dog.id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-[#111111]">강아지 등록</h2>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="이름 *" className="rounded-[16px]" />
      <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder="견종" className="rounded-[16px]" />
      <Input value={foodBrand} onChange={e => setFoodBrand(e.target.value)} placeholder="주 사료 브랜드" className="rounded-[16px]" />
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || loading}
        className="rounded-[16px] bg-[#111111] text-white"
      >
        {loading ? '등록 중...' : '강아지 등록'}
      </Button>
    </div>
  )
}
