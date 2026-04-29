import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { signInWithGoogle, useAuth } from '@/hooks/useAuth'
import RoleSelect from '@/components/onboarding/RoleSelect'
import type { UserRole } from '@/types/domain'

export default function OnboardingPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [_saving, setSaving] = useState(false)

  if (loading) return <div className="p-4">Loading...</div>

  if (user) {
    const pendingToken = localStorage.getItem('pendingInviteToken')
    if (pendingToken) {
      localStorage.removeItem('pendingInviteToken')
      navigate(`/invite/${pendingToken}`, { replace: true })
      return null
    }
  }

  if (user && role === 'teacher') { navigate('/'); return null }
  if (user && role === 'guardian') { navigate('/feed'); return null }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-3xl font-bold text-[#111111]">Doggy-note 🐾</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded-[30px] bg-[#111111] px-8 py-3 text-white font-medium"
        >
          Google로 시작하기
        </button>
      </div>
    )
  }

  async function handleRoleSelect(selectedRole: UserRole) {
    if (!user) return
    setSaving(true)
    const displayName = user.user_metadata?.full_name ?? ''

    const { data: existing } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    const { error } = existing
      ? await supabase
          .from('user_profiles')
          .update({ role: selectedRole, display_name: displayName })
          .eq('id', user.id)
      : await supabase
          .from('user_profiles')
          .insert({ id: user.id, role: selectedRole, display_name: displayName })

    if (error) { console.error('프로필 생성 실패:', error); setSaving(false); return }
    if (selectedRole === 'teacher') navigate('/onboarding/join-daycare')
    else navigate('/feed')
    setSaving(false)
  }

  return <RoleSelect onSelect={handleRoleSelect} />
}
