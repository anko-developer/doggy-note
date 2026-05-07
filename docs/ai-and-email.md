# AI 요약 및 이메일 알림

## AI 요약 생성 흐름

### 1. 프론트엔드 트리거 (AISummaryCard)

선생님이 알림장을 저장한 뒤 "AI 요약 생성하기" 버튼을 클릭한다.

```
클릭 →
  onBeforeGenerate() 호출 (최신 내용 먼저 저장)
  supabase.functions.invoke('generate-summary', {
    body: {
      report_id,
      dog_name,
      meals_eaten,
      food_brand,
      walk_count,
      walk_distance_km,
      training_log,
      mood,
      teacher_note,
    }
  })
```

### 2. Edge Function 처리 (generate-summary)

```
1. 요청 데이터 파싱
2. 한국어 프롬프트 구성
   - 기분, 식사량, 사료, 산책, 훈련, 선생님 메모 포함
   - "1~2문장, 이모지 1개, 자연스러운 반말체" 지시
3. OpenAI API 호출 (gpt-4o-mini, max_tokens: 200)
4. DB 저장:
   UPDATE daily_reports
   SET ai_summary = '...', ai_summary_failed = false
   WHERE id = report_id
5. { summary } 응답 반환
```

실패 시:

```
UPDATE daily_reports
SET ai_summary_failed = true
WHERE id = report_id
```

### 3. 클라이언트 처리

Edge Function 응답 수신 후:

```
setSummary(text)        로컬 상태 업데이트
setIsFailed(false)
invalidateQueries(['report'])   서버 상태 동기화
```

### 재생성

이미 요약이 있어도 "재생성" 버튼으로 다시 생성할 수 있다. 같은 흐름을 반복하며 DB의 ai_summary가 덮어쓰인다.

---

## 이메일 알림 흐름 (notify-guardian)

### 트리거 시점

선생님이 "알림장 보내기" 클릭 → `published_at` 저장 성공 직후:

```typescript
// 비동기, fire-and-forget (실패해도 publish 자체는 성공)
supabase.functions.invoke('notify-guardian', { body: { report_id } })
  .catch(e => console.error('이메일 알림 실패:', e))
```

### Edge Function 처리 (notify-guardian)

```
1. report_id로 daily_reports + dogs 조회
   - dog name, owner_id 포함

2. service_role key로 보호자 이메일 조회
   supabase.auth.admin.getUserById(owner_id)
   → email 추출

3. ai_summary가 있으면 그대로, 없으면 기본 메시지 사용

4. Resend API 호출
   from: Doggy-note <onboarding@resend.dev>
   to: 보호자 이메일
   subject: 🐾 {강아지이름}의 오늘 알림장이 도착했어요
   body: HTML 이메일 (요약 + 앱 링크)
```

### 설계 의도

- **비동기 처리:** 이메일 실패가 알림장 발송에 영향을 주지 않는다
- **service_role 필요:** `auth.admin.getUserById`는 일반 anon key로 호출 불가
- **AI 요약 우선 사용:** 요약이 있으면 이메일 본문에 포함하여 보호자가 앱을 열기 전에 내용을 파악할 수 있다

---

## CORS 처리

두 Edge Function 모두 OPTIONS preflight 처리를 포함한다.

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })
}
```
