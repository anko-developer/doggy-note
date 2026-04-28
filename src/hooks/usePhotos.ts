import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useDogPhotos(dogId: string) {
  return useQuery({
    queryKey: ['photos', dogId],
    enabled: !!dogId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .eq('dog_id', dogId)
        .order('taken_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data
    },
  })
}

export function useUploadPhoto(dogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const ext = file.name.split('.').pop() ?? 'jpg'
      const path = `${dogId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('photos').insert({ dog_id: dogId, storage_path: path })
      if (dbError) throw dbError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', dogId] }),
    onError: (error) => {
      console.error('사진 업로드 실패:', error)
    },
  })
}
