import { useState } from "react"
import { useNavigate, Navigate } from "react-router-dom"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/useAuth"
import DogForm from "@/components/dogs/DogForm"
import { Button } from "@/components/ui/button"
import { createInvite } from "@/hooks/useInvite"

export default function TeacherHomePage() {
  const { user, role, daycareId } = useAuth()

  if (role === 'guardian') return <Navigate to="/feed" replace />
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [inviteLoading, setInviteLoading] = useState<Record<string, boolean>>({})
  const [inviteError, setInviteError] = useState('')

  const { data: dogs } = useQuery({
    queryKey: ["dogs", daycareId],
    enabled: !!daycareId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dogs")
        .select("*")
        .eq("daycare_id", daycareId!)
        .order("name")
      if (error) throw error
      return data
    },
  })

  function handleDogCreated(dogId: string) {
    qc.invalidateQueries({ queryKey: ["dogs"] })
    setShowForm(false)
    navigate(`/report/${dogId}/write`)
  }

  async function handleInvite(dog: { id: string; name: string }) {
    setInviteLoading(prev => ({ ...prev, [dog.id]: true }))
    setInviteError('')
    try {
      const token = await createInvite(dog.id, daycareId!)
      const link = `${window.location.origin}/invite/${token}`
      await navigator.clipboard.writeText(link)
      alert(`${dog.name} 초대 링크가 클립보드에 복사됐어요!`)
    } catch {
      setInviteError('초대 링크 생성에 실패했어요.')
    } finally {
      setInviteLoading(prev => ({ ...prev, [dog.id]: false }))
    }
  }

  if (!daycareId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-[#9E9EA0]">아직 유치원에 연결되지 않았어요.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#111111]">오늘의 알림장</h1>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm" className="rounded-[30px]">
          {showForm ? "취소" : "+ 강아지 추가"}
        </Button>
      </div>

      {showForm && (
        <div className="rounded-[20px] border border-[#CACACB] bg-white">
          <DogForm daycareId={daycareId} teacherId={user!.id} onCreated={handleDogCreated} />
        </div>
      )}

      {inviteError && <p className="text-sm text-red-500">{inviteError}</p>}

      {dogs !== undefined && dogs.length === 0 && !showForm && (
        <div className="py-12 text-center text-[#9E9EA0]">
          <p className="text-4xl mb-4">🐾</p>
          <p>아직 등록된 강아지가 없어요.</p>
          <p className="text-sm mt-1">강아지를 추가하고 알림장을 써보세요!</p>
        </div>
      )}

      {(dogs ?? []).map((dog) => (
        <div key={dog.id} className="rounded-[20px] border border-[#CACACB] bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-bold text-[#111111]">{dog.name}</p>
              {dog.breed && <p className="text-sm text-[#9E9EA0]">{dog.breed}</p>}
            </div>
            <button onClick={() => navigate(`/report/${dog.id}/write`)} className="text-sm text-[#111111] font-medium">
              알림장 쓰기 →
            </button>
          </div>
          <button
            onClick={() => handleInvite(dog)}
            disabled={inviteLoading[dog.id]}
            className="w-full rounded-[30px] border border-[#CACACB] py-2 text-sm text-[#707072]"
          >
            {inviteLoading[dog.id] ? "생성 중..." : "🔗 보호자 초대 링크 복사"}
          </button>
        </div>
      ))}
    </div>
  )
}
