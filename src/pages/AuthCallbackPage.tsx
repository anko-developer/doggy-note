import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/onboarding', { replace: true })
      } else if (event === 'INITIAL_SESSION') {
        if (session) {
          navigate('/onboarding', { replace: true })
        } else {
          navigate('/onboarding', { replace: true })
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-[#62625b]">로그인 처리 중...</p>
    </div>
  )
}
