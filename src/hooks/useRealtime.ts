import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useReportRealtime(dogId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!dogId) return

    const channel = supabase
      .channel(`reports:${dogId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_reports',
          filter: `dog_id=eq.${dogId}`,
        },
        (payload) => {
          const next = payload.new as { published_at?: string | null }
          if (next?.published_at) {
            qc.invalidateQueries({ queryKey: ['reports', dogId] })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dogId, qc])
}
