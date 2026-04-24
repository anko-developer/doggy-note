import { render, screen, fireEvent } from '@testing-library/react'
import MoodChip from '@/components/reports/MoodChip'

describe('MoodChip', () => {
  it('선택되지 않은 상태에서 클릭하면 onSelect 호출', () => {
    const onSelect = vi.fn()
    render(<MoodChip mood="happy" selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('happy')
  })

  it('선택된 상태에서 배경색이 brand red', () => {
    render(<MoodChip mood="happy" selected={true} onSelect={vi.fn()} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-[#e60023]')
  })
})
