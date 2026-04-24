import { useState } from 'react'
import type { TrainingEntry } from '@/types/domain'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type Props = { entries: TrainingEntry[]; onChange: (entries: TrainingEntry[]) => void }

export default function TrainingLog({ entries, onChange }: Props) {
  const [command, setCommand] = useState('')

  function addEntry() {
    if (!command.trim()) return
    onChange([...entries, { command: command.trim(), reps: 1, success: 1 }])
    setCommand('')
  }

  function updateEntry(index: number, field: keyof TrainingEntry, value: number | string) {
    const next = entries.map((e, i) => i === index ? { ...e, [field]: value } : e)
    onChange(next)
  }

  function removeEntry(index: number) {
    onChange(entries.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 rounded-[12px] bg-[#f6f6f3] p-3">
          <span className="flex-1 text-sm font-medium text-[#211922]">{entry.command}</span>
          <Input
            type="number"
            value={entry.reps}
            onChange={e => updateEntry(i, 'reps', Number(e.target.value))}
            className="w-16 text-center rounded-[12px]"
            min={1}
          />
          <span className="text-xs text-[#62625b]">회 중</span>
          <Input
            type="number"
            value={entry.success}
            onChange={e => updateEntry(i, 'success', Number(e.target.value))}
            className="w-16 text-center rounded-[12px]"
            min={0}
          />
          <span className="text-xs text-[#62625b]">성공</span>
          <button onClick={() => removeEntry(i)} className="text-[#91918c] text-lg">×</button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input
          value={command}
          onChange={e => setCommand(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addEntry()}
          placeholder="앉아, 기다려..."
          className="rounded-[16px]"
        />
        <Button onClick={addEntry} variant="outline" className="rounded-[16px]">추가</Button>
      </div>
    </div>
  )
}
