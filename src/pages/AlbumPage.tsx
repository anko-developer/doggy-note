import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDogPhotos, useUploadPhoto } from '@/hooks/usePhotos'

function PhotoGrid({ dogId, canUpload }: { dogId: string; canUpload: boolean }) {
  const { data: photos } = useDogPhotos(dogId)
  const upload = useUploadPhoto(dogId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')

  function handleFiles(files: FileList | null) {
    if (!files) return
    setUploadError('')
    Array.from(files).forEach(f =>
      upload.mutate(f, {
        onError: () => setUploadError('사진 업로드에 실패했어요. 다시 시도해주세요.'),
      })
    )
  }

  return (
    <div>
      {canUpload && (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => handleFiles(e.target.files)}
          />
          <button
            onClick={() => { setUploadError(''); inputRef.current?.click() }}
            disabled={upload.isPending}
            className="mb-2 w-full rounded-[30px] border border-dashed border-[#CACACB] py-4 text-sm text-[#9E9EA0] disabled:opacity-50"
          >
            {upload.isPending ? '업로드 중...' : '+ 사진 추가'}
          </button>
          {uploadError && (
            <p className="mb-3 text-center text-sm text-red-500">{uploadError}</p>
          )}
        </>
      )}
      {photos !== undefined && photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-[#F5F5F5] py-14 text-center">
          <p className="text-4xl mb-3">🐾</p>
          <p className="font-bold text-[#111111]">아직 사진이 없어요</p>
          {canUpload && <p className="text-sm text-[#9E9EA0] mt-1">위 버튼으로 첫 사진을 추가해보세요.</p>}
        </div>
      ) : (
        <div style={{ columns: 2, columnGap: 8 }}>
          {(photos ?? []).map((p) => {
            const { data } = supabase.storage.from('photos').getPublicUrl(p.storage_path)
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
  const { user, role, daycareId } = useAuth()

  const { data: dogs } = useQuery({
    queryKey: role === 'teacher' ? ['daycare-dogs', daycareId] : ['my-dogs', user?.id],
    enabled: role === 'teacher' ? !!daycareId : !!user,
    queryFn: async () => {
      if (role === 'teacher') {
        const { data, error } = await supabase
          .from('dogs')
          .select('*')
          .eq('daycare_id', daycareId!)
          .order('name')
        if (error) throw error
        return data
      }
      const { data, error } = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', user!.id)
        .limit(1)
      if (error) throw error
      return data
    },
  })

  if (!dogs) return null

  if (dogs.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-4xl">🐾</p>
        <p className="font-bold text-[#111111]">
          {role === 'teacher' ? '등록된 강아지가 없어요' : '연결된 강아지가 없어요'}
        </p>
        <p className="text-sm text-[#9E9EA0]">
          {role === 'teacher' ? '홈에서 강아지를 추가해보세요.' : '선생님께 초대 링크를 요청해보세요.'}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold text-[#111111]">앨범</h1>
      {dogs.map(dog => (
        <div key={dog.id} className="mb-6">
          {role === 'teacher' && dogs.length > 1 && (
            <p className="mb-2 text-sm font-bold text-[#111111]">{dog.name}</p>
          )}
          <PhotoGrid dogId={dog.id} canUpload={role === 'teacher'} />
        </div>
      ))}
    </div>
  )
}
