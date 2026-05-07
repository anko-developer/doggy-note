import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useDogPhotos, useUploadPhoto, useDeletePhoto } from '@/hooks/usePhotos'
import { Skeleton } from '@/components/ui/skeleton'
import { useMinLoading } from '@/hooks/useMinLoading'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

function PhotoGrid({ dogId, canUpload }: { dogId: string; canUpload: boolean }) {
  const { data: photos } = useDogPhotos(dogId)
  const upload = useUploadPhoto(dogId)
  const del = useDeletePhoto(dogId)
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; storagePath: string } | null>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    setUploadError('')
    Array.from(files).forEach(f =>
      upload.mutate(f, {
        onError: () => setUploadError('사진 업로드에 실패했어요. 다시 시도해주세요.'),
      })
    )
  }

  function handleDelete(id: string, storagePath: string) {
    setDeleteTarget({ id, storagePath })
  }

  return (
    <div>
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사진 삭제</DialogTitle>
            <DialogDescription>이 사진을 삭제할까요? 삭제한 사진은 복구할 수 없어요.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose className="flex-1">
              <Button variant="outline" className="w-full rounded-[12px]">취소</Button>
            </DialogClose>
            <Button
              variant="destructive"
              className="flex-1 rounded-[12px]"
              disabled={del.isPending}
              onClick={() => {
                if (deleteTarget) {
                  del.mutate(deleteTarget, { onSuccess: () => setDeleteTarget(null) })
                }
              }}
            >
              {del.isPending ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div key={p.id} className="relative mb-2" style={{ breakInside: 'avoid' }}>
                <img
                  src={data.publicUrl}
                  alt=""
                  className="w-full rounded-[16px] object-cover"
                />
                {canUpload && (
                  <button
                    onClick={() => handleDelete(p.id, p.storage_path)}
                    disabled={del.isPending}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs disabled:opacity-50"
                    aria-label="사진 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function AlbumPage() {
  const { user, role, daycareId } = useAuth()

  const { data: dogs, isLoading: dogsQueryLoading } = useQuery({
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

  const isLoading = useMinLoading(dogsQueryLoading, !!dogs)

  if (isLoading) return (
    <div className="p-4 pb-24">
      <Skeleton className="h-7 w-16 mb-4" />
      <div style={{ columns: 2, columnGap: 8 }}>
        {[160, 220, 200, 140].map((h, i) => (
          <div key={i} className="mb-2" style={{ breakInside: 'avoid' }}>
            <Skeleton className="w-full rounded-[16px]" style={{ height: h }} />
          </div>
        ))}
      </div>
    </div>
  )

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
