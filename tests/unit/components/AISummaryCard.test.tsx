import { render, screen } from '@testing-library/react'
import AISummaryCard from '@/components/reports/AISummaryCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

vi.mock('@/lib/supabase', () => ({
  supabase: {
    functions: { invoke: vi.fn() },
    from: vi.fn(() => ({ update: vi.fn(() => ({ eq: vi.fn(() => Promise.resolve({ error: null })) })) })),
  },
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
)

describe('AISummaryCard', () => {
  it('기존 요약이 있으면 표시', () => {
    render(
      <AISummaryCard
        reportId="r1"
        existingSummary="보리가 오늘 잘 먹었어요"
        failed={false}
        dogName="보리"
        reportData={{ meals_eaten: 'full', food_brand: '오리젠', walk_count: 2,
          walk_distance_km: 1.2, training_log: [], mood: 'happy', teacher_note: '' }}
      />,
      { wrapper }
    )
    expect(screen.getByText('보리가 오늘 잘 먹었어요')).toBeInTheDocument()
  })

  it('실패 상태에서 재시도 버튼 표시', () => {
    render(
      <AISummaryCard
        reportId="r1"
        existingSummary={undefined}
        failed={true}
        dogName="보리"
        reportData={{ meals_eaten: 'half', food_brand: '사료', walk_count: 1,
          walk_distance_km: 0.5, training_log: [], mood: 'neutral', teacher_note: '' }}
      />,
      { wrapper }
    )
    expect(screen.getByText(/재시도/)).toBeInTheDocument()
  })
})
