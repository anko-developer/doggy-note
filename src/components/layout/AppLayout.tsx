import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import TabBar from '@/components/layout/TabBar'

export default function AppLayout() {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>
  if (!user || !role) return <Navigate to="/onboarding" replace />

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <main className="pb-20">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
