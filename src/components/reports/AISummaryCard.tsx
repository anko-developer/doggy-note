type Props = {
  reportId: string
  existingSummary?: string
  failed: boolean
  dogName: string
  reportData: Record<string, unknown>
}

export default function AISummaryCard({ existingSummary, failed }: Props) {
  return (
    <div className="rounded-[12px] border border-[#e5e5e0] bg-[hsla(60,20%,98%,0.5)] p-4">
      <span className="text-xs font-medium text-[#91918c]">✨ AI 요약</span>
      {failed && <p className="text-sm text-red-500 mt-1">요약 생성에 실패했어요. <button className="underline">재시도</button></p>}
      {existingSummary && <p className="text-sm text-[#211922] leading-relaxed mt-1">{existingSummary}</p>}
    </div>
  )
}
