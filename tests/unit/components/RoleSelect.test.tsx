import { render, screen, fireEvent } from '@testing-library/react'
import RoleSelect from '@/components/onboarding/RoleSelect'

describe('RoleSelect', () => {
  it('선생님 선택 시 onSelect("teacher") 호출', () => {
    const onSelect = vi.fn()
    render(<RoleSelect onSelect={onSelect} />)
    fireEvent.click(screen.getByText('선생님이에요 🏫'))
    expect(onSelect).toHaveBeenCalledWith('teacher')
  })

  it('보호자 선택 시 onSelect("guardian") 호출', () => {
    const onSelect = vi.fn()
    render(<RoleSelect onSelect={onSelect} />)
    fireEvent.click(screen.getByText('보호자예요 🐾'))
    expect(onSelect).toHaveBeenCalledWith('guardian')
  })
})
