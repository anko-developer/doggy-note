import { Outlet, Navigate } from 'react-router-dom'
import { useAuth, signOut } from '@/hooks/useAuth'
import TabBar from '@/components/layout/TabBar'

export default function AppLayout() {
  const { user, role, daycareId, loading } = useAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>
  if (!user || !role) return <Navigate to="/onboarding" replace />
  if (role === 'teacher' && !daycareId) return <Navigate to="/onboarding/join-daycare" replace />

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e0]">
        <span className="font-bold text-[#211922]">Doggy-note 🐾</span>
        <button
          onClick={signOut}
          className="text-sm text-[#91918c]"
        >
          로그아웃
        </button>
      </header>
      <main className="pb-20">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
