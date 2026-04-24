import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import MoodChip from '@/components/reports/MoodChip'
import MealChip from '@/components/reports/MealChip'
import TrainingLog from '@/components/reports/TrainingLog'
import AISummaryCard from '@/components/reports/AISummaryCard'
import { useTodayReport, useUpsertReport, usePublishReport } from '@/hooks/useReport'
import type { Mood, MealsEaten, TrainingEntry } from '@/types/domain'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export default function ReportWritePage() {
  const { dogId } = useParams<{ dogId: string }>()
  const navigate = useNavigate()
  const { data: report } = useTodayReport(dogId!)
  const upsert = useUpsertReport()
  const publish = usePublishReport()

  const { data: dog } = useQuery({
    queryKey: ['dog', dogId],
    queryFn: async () => {
      const { data } = await (supabase as any).from('dogs').select('*').eq('id', dogId!).single()
      return data
    },
  })

  const [mood, setMood] = useState<Mood>('neutral')
  const [meals, setMeals] = useState<MealsEaten>('full')
  const [foodBrand, setFoodBrand] = useState('')
  const [walkCount, setWalkCount] = useState(0)
  const [walkDist, setWalkDist] = useState(0)
  const [training, setTraining] = useState<TrainingEntry[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!report) return
    setMood((report.mood as Mood) ?? 'neutral')
    setMeals((report.meals_eaten as MealsEaten) ?? 'full')
    setFoodBrand(report.food_brand_today ?? dog?.food_brand ?? '')
    setWalkCount(report.walk_count ?? 0)
    setWalkDist(Number(report.walk_distance_km) ?? 0)
    setTraining((report.training_log as TrainingEntry[]) ?? [])
    setNote(report.teacher_note ?? '')
  }, [report, dog])

  async function handleSave() {
    await upsert.mutateAsync({
      id: report?.id,
      dog_id: dogId!,
      date: new Date().toISOString().split('T')[0],
      mood,
      meals_eaten: meals,
      food_brand_today: foodBrand,
      walk_count: walkCount,
      walk_distance_km: walkDist,
      training_log: training,
      teacher_note: note,
    })
  }

  async function handlePublish() {
    if (!report?.id) return
    await publish.mutateAsync(report.id)
    navigate('/')
  }

  const isPublished = !!report?.published_at

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-xl font-bold text-[#211922]">{dog?.name ?? ''}의 알림장</h1>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">오늘 기분</p>
        <div className="flex flex-wrap gap-2">
          {(['sleepy', 'neutral', 'happy', 'excited'] as Mood[]).map(m => (
            <MoodChip key={m} mood={m} selected={mood === m} onSelect={setMood} />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">식사 섭취량</p>
        <div className="flex gap-2">
          {(['none', 'half', 'full'] as MealsEaten[]).map(m => (
            <MealChip key={m} meal={m} selected={meals === m} onSelect={setMeals} />
          ))}
        </div>
        <Input
          value={foodBrand}
          onChange={e => setFoodBrand(e.target.value)}
          placeholder="오늘 사료 브랜드"
          className="mt-2 rounded-[16px]"
        />
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">산책</p>
        <div className="flex gap-2">
          <Input type="number" value={walkCount} onChange={e => setWalkCount(Number(e.target.value))}
            placeholder="횟수" className="rounded-[16px]" min={0} />
          <Input type="number" value={walkDist} onChange={e => setWalkDist(Number(e.target.value))}
            placeholder="거리(km)" step="0.1" className="rounded-[16px]" min={0} />
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">훈련</p>
        <TrainingLog entries={training} onChange={setTraining} />
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">선생님 한마디</p>
        <Textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="오늘 특별히 있었던 일을 적어주세요"
          className="rounded-[16px] min-h-[100px]" />
      </section>

      <Button onClick={handleSave} variant="outline" className="rounded-[16px]" disabled={upsert.isPending}>
        {upsert.isPending ? '저장 중...' : '임시 저장'}
      </Button>

      {report?.id && (
        <AISummaryCard
          reportId={report.id}
          existingSummary={report.ai_summary ?? undefined}
          failed={report.ai_summary_failed ?? false}
          dogName={dog?.name ?? ''}
          reportData={{ meals_eaten: meals, food_brand: foodBrand, walk_count: walkCount,
            walk_distance_km: walkDist, training_log: training, mood, teacher_note: note }}
        />
      )}

      {!isPublished && report?.ai_summary && (
        <Button onClick={handlePublish} disabled={publish.isPending}
          className="rounded-[16px] bg-[#e60023] text-white">
          {publish.isPending ? '발송 중...' : '알림장 보내기 ✈️'}
        </Button>
      )}

      {isPublished && (
        <p className="text-center text-sm text-[#91918c]">발송 완료 ✓</p>
      )}
    </div>
  )
}
