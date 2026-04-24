import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const TEACHER_TABS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/announcements', label: '공지', icon: '📢' },
  { to: '/schedule', label: '일정', icon: '📅' },
  { to: '/album', label: '앨범', icon: '📷' },
  { to: '/meal-plan', label: '식단', icon: '🍽' },
]

const GUARDIAN_TABS = [
  { to: '/feed', label: '알림장', icon: '📝' },
  { to: '/announcements', label: '공지', icon: '📢' },
  { to: '/schedule', label: '일정', icon: '📅' },
  { to: '/album', label: '앨범', icon: '📷' },
]

export default function TabBar() {
  const { role } = useAuth()
  const tabs = role === 'teacher' ? TEACHER_TABS : GUARDIAN_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#e5e5e0] bg-white">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
            isActive ? 'text-[#e60023] font-medium' : 'text-[#91918c]'
          )}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
