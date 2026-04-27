import type { UserRole } from '@/types/domain'

type Props = { onSelect: (role: UserRole) => void }

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-[#111111]" style={{ letterSpacing: '-1.2px' }}>
        어떤 역할로 시작할까요?
      </h1>
      <button
        onClick={() => onSelect('teacher')}
        className="rounded-[30px] bg-[#111111] px-6 py-4 text-white font-medium text-lg"
      >
        선생님이에요 🏫
      </button>
      <button
        onClick={() => onSelect('guardian')}
        className="rounded-[30px] bg-[#F5F5F5] px-6 py-4 text-[#111111] font-medium text-lg"
      >
        보호자예요 🐾
      </button>
    </div>
  )
}
