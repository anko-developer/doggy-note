import { useEffect, useRef, useState } from 'react'

// hasData: 마운트 시점에 이미 데이터가 있으면 스켈레톤 생략
// 실제 로딩이 시작된 경우 isLoading이 false가 될 때 minMs를 보장
export function useMinLoading(isLoading: boolean, hasData = false, minMs = 1000): boolean {
  const initialHasData = useRef(hasData)
  const [show, setShow] = useState(isLoading && !initialHasData.current)
  const startRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    // 마운트 시점에 데이터가 이미 있었으면 스켈레톤 불필요
    if (initialHasData.current) return

    if (isLoading) {
      startRef.current = Date.now()
      setShow(true)
    } else {
      const elapsed = startRef.current != null ? Date.now() - startRef.current : minMs
      const remaining = minMs - elapsed
      if (remaining <= 0) {
        setShow(false)
      } else {
        timerRef.current = setTimeout(() => setShow(false), remaining)
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isLoading, minMs])

  return show
}
