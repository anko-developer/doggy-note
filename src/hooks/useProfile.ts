import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('daycare_id')
        .eq('id', user!.id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useDaycareId(): string | null {
  const { user, role } = useAuth()
  const { data: profile } = useProfile()

  const { data: guardianDog } = useQuery({
    queryKey: ['guardian-dog', user?.id],
    enabled: !!user && role === 'guardian',
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dogs')
        .select('daycare_id')
        .eq('owner_id', user!.id)
        .limit(1)
        .single()
      if (error) throw error
      return data
    },
  })

  return role === 'guardian' ? guardianDog?.daycare_id ?? null : profile?.daycare_id ?? null
}
