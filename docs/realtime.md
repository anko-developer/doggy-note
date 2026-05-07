# 실시간 구독 (Realtime)

## 사용 위치

`GuardianFeedPage`에서 `useReportRealtime(dogId)` 훅을 사용한다.

선생님이 알림장을 발송하면 보호자 화면에 자동으로 새 알림장이 나타난다.

## 구독 방식

```typescript
// src/hooks/useRealtime.ts

const channel = supabase
  .channel(`reports:${dogId}`)        // 강아지별 채널
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',                 // 업데이트 이벤트만 구독
      schema: 'public',
      table: 'daily_reports',
      filter: `dog_id=eq.${dogId}`,    // 해당 강아지 레코드만
    },
    (payload) => {
      if (payload.new?.published_at) { // published_at이 설정된 경우만 반응
        qc.invalidateQueries({ queryKey: ['reports', dogId] })
      }
    }
  )
  .subscribe()
```

## 동작 시나리오

```
선생님: "알림장 보내기" 클릭
  → daily_reports.published_at = now() (DB UPDATE)
  ↓
Supabase Realtime이 변경 감지
  ↓
보호자 기기의 채널 콜백 실행
  payload.new.published_at 확인 (null이 아님)
  ↓
invalidateQueries(['reports', dogId])
  ↓
useQuery가 서버에서 새 데이터 fetch
  (published_at IS NOT NULL 조건 포함)
  ↓
새 ReportCard가 피드 상단에 표시
```

## 구독 정리 (cleanup)

컴포넌트 언마운트 시 채널을 제거한다.

```typescript
return () => {
  supabase.removeChannel(channel)
}
```

## 설계 원칙

- **필터 조건 적용:** `dog_id=eq.{dogId}` 필터로 다른 강아지의 변경은 무시
- **조건부 반응:** `published_at`이 설정된 경우만 쿼리 무효화. 선생님의 임시 저장 등 다른 UPDATE는 보호자 화면에 영향 없음
- **폴링 미사용:** Realtime을 통해 즉시 반응하므로 주기적 refetch 불필요
