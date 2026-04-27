import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useReportRealtime } from '@/hooks/useRealtime'
import ReportCard from '@/components/reports/ReportCard'

export default function GuardianFeedPage() {
  const { user } = useAuth()

  const { data: dogs } = useQuery({
    queryKey: ['my-dogs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from('dogs').select('*').eq('owner_id', user!.id)
      return data ?? []
    },
  })

  const primaryDog = dogs?.[0]
  useReportRealtime(primaryDog?.id ?? '')

  const { data: reports } = useQuery({
    queryKey: ['reports', primaryDog?.id],
    enabled: !!primaryDog,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('daily_reports')
        .select('*')
        .eq('dog_id', primaryDog!.id)
        .not('published_at', 'is', null)
        .order('date', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })

  if (!dogs) return null

  if (!primaryDog) return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl">🐾</p>
      <p className="font-bold text-[#111111]">아직 연결된 강아지가 없어요</p>
      <p className="text-sm text-[#9E9EA0]">선생님께 초대 링크를 요청하고<br />링크를 클릭하면 자동으로 연결돼요.</p>
    </div>
  )

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-bold text-[#111111]">{primaryDog.name}의 알림장</h1>
      {reports?.map((r: any) => <ReportCard key={r.id} report={r} />)}
      {reports !== undefined && reports.length === 0 && <p className="text-center text-sm text-[#9E9EA0]">아직 받은 알림장이 없어요 🐾</p>}
    </div>
  )
}
