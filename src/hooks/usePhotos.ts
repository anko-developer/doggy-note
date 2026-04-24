import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDogPhotos(dogId: string) {
  return useQuery({
    queryKey: ['photos', dogId],
    enabled: !!dogId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('photos')
        .select('*')
        .eq('dog_id', dogId)
        .order('taken_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })
}

export function useUploadPhoto(dogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `${dogId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await (supabase as any).storage.from('photos').upload(path, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await (supabase as any).from('photos').insert({ dog_id: dogId, storage_path: path })
      if (dbError) throw dbError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', dogId] }),
  })
}
