import { supabase } from '@/lib/supabase'

export function generateInviteToken(): string {
  return crypto.randomUUID()
}

export async function createInvite(dogId: string, daycareId: string) {
  const token = generateInviteToken()
  const { data, error } = await (supabase as any)
    .from('invites')
    .insert({ token, dog_id: dogId, daycare_id: daycareId })
    .select('token')
    .single()
  if (error) throw error
  return data.token as string
}

export async function acceptInvite(token: string) {
  const { error } = await (supabase as any).rpc('accept_invite', { p_token: token })
  if (error) throw error
}
