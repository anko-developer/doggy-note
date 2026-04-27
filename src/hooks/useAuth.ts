import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/domain'

type AuthState = {
  user: User | null
  role: UserRole | null
  daycareId: string | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, role: null, daycareId: null, loading: true })

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null
      if (user) {
        fetchProfile(user.id).then(({ role, daycareId }) => setState({ user, role, daycareId, loading: false }))
      } else {
        setState({ user: null, role: null, daycareId: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

async function fetchProfile(userId: string): Promise<{ role: UserRole | null; daycareId: string | null }> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role, daycare_id')
    .eq('id', userId)
    .single()
  const row = data as { role: string; daycare_id: string | null } | null
  return {
    role: (row?.role as UserRole) ?? null,
    daycareId: row?.daycare_id ?? null,
  }
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
