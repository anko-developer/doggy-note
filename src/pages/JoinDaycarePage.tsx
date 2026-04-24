import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import JoinDaycare from '@/components/onboarding/JoinDaycare'

export default function JoinDaycarePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return <div className="p-4">Loading...</div>
  if (!user) { navigate('/onboarding', { replace: true }); return null }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <JoinDaycare userId={user.id} onJoined={() => navigate('/', { replace: true })} />
    </div>
  )
}
