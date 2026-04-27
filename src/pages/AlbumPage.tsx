import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDogPhotos, useUploadPhoto } from '@/hooks/usePhotos'

function PhotoGrid({ dogId }: { dogId: string }) {
  const { data: photos } = useDogPhotos(dogId)
  const upload = useUploadPhoto(dogId)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => upload.mutate(f))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="mb-4 w-full rounded-[16px] border border-dashed border-[#e5e5e0] py-4 text-sm text-[#91918c]"
      >
        + 사진 추가
      </button>
      {photos !== undefined && photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#f6f6f3] py-14 text-center">
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-bold text-[#211922]">아직 사진이 없어요</p>
          <p className="text-sm text-[#91918c] mt-1">위 버튼으로 첫 사진을 추가해보세요.</p>
        </div>
      ) : (
        <div style={{ columns: 2, columnGap: 8 }}>
          {(photos ?? []).map((p: any) => {
            const { data } = (supabase as any).storage.from('photos').getPublicUrl(p.storage_path)
            return (
              <img
                key={p.id}
                src={data.publicUrl}
                alt=""
                className="mb-2 w-full rounded-[16px] object-cover"
                style={{ breakInside: 'avoid' }}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AlbumPage() {
  const { user } = useAuth()
  const { data: dogs } = useQuery({
    queryKey: ['my-dogs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).from('dogs').select('*').eq('owner_id', user!.id).limit(1)
      return data ?? []
    },
  })

  const dog = dogs?.[0]
  if (!dog) return <div className="p-4 text-center text-[#91918c]">강아지를 먼저 등록해주세요.</div>

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold text-[#211922]">앨범</h1>
      <PhotoGrid dogId={dog.id} />
    </div>
  )
}
