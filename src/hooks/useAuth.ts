import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { UserRole } from '@/types/domain'

type AuthState = {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, role: null, loading: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      if (user) {
        fetchRole(user.id).then(role => setState({ user, role, loading: false }))
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null
      if (user) {
        fetchRole(user.id).then(role => setState({ user, role, loading: false }))
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

async function fetchRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  const row = data as { role: string } | null
  return (row?.role as UserRole) ?? null
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
