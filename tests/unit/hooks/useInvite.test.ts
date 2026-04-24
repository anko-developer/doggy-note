import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/supabase', () => ({ supabase: {} }))

import { generateInviteToken } from '@/hooks/useInvite'

describe('generateInviteToken', () => {
  it('UUID v4 형식 토큰 반환', () => {
    const token = generateInviteToken()
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuidV4Pattern.test(token)).toBe(true)
  })

  it('매번 다른 토큰 생성', () => {
    expect(generateInviteToken()).not.toBe(generateInviteToken())
  })
})
