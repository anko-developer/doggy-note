# API 통신 방식 리뷰

## 개요

Doggy-note는 별도의 백엔드 서버 없이 **Supabase**를 직접 사용하는 BaaS(Backend as a Service) 구조입니다.
모든 API 통신은 `@supabase/supabase-js` SDK를 통해 이루어지며, 4가지 채널로 나뉩니다.

```
SPA (React)
  ├── Supabase Auth        → 인증 (Google OAuth)
  ├── Supabase Database    → 데이터 CRUD (PostgREST)
  ├── Supabase Storage     → 파일 업로드/삭제
  ├── Supabase Realtime    → 실시간 구독 (WebSocket)
  └── Supabase Edge Func  → AI 요약 생성 (Deno)
```

---

## 1. 클라이언트 초기화

**`src/lib/supabase.ts`**

```ts
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

- `Database` 제네릭을 주입해 모든 `supabase.from('table')` 호출이 TypeScript 타입을 갖습니다.
- `anon key`는 공개 키입니다. 실제 접근 제어는 DB의 RLS(Row Level Security) 정책이 담당합니다.

---

## 2. 인증 — Supabase Auth

### 흐름

```
사용자 클릭 → signInWithOAuth(google)
  → Google 동의 화면
  → /auth/callback (리다이렉트)
  → supabase.auth.onAuthStateChange('SIGNED_IN')
  → fetchProfile(userId) → user_profiles 조회
  → React 상태 업데이트
```

### 핵심 코드 (`src/hooks/useAuth.ts`)

| 동작 | 메서드 |
|------|--------|
| Google 로그인 | `supabase.auth.signInWithOAuth({ provider: 'google' })` |
| 로그아웃 | `supabase.auth.signOut()` |
| 세션 구독 | `supabase.auth.onAuthStateChange(callback)` |
| 역할/유치원 조회 | `supabase.from('user_profiles').select('role, daycare_id')` |

### 특징

- 세션 상태는 `localStorage`에 자동 저장됩니다 (SDK 기본 동작).
- `useAuth()`는 전역 싱글턴 훅이 아닌 **컴포넌트마다 독립적으로 구독**합니다. 여러 컴포넌트가 `useAuth()`를 호출하면 각각 `onAuthStateChange`를 구독합니다.
- 초대 링크를 통한 접근은 `localStorage`에 토큰을 임시 저장한 뒤 로그인 완료 후 처리합니다 (`pendingInviteToken`).

---

## 3. 데이터베이스 — PostgREST

모든 테이블 통신은 SDK의 Query Builder를 사용합니다. **별도 REST 엔드포인트나 GraphQL 없이** Supabase가 자동 생성한 PostgREST API를 호출합니다.

### 데이터 페칭 패턴 (`useQuery` + Supabase)

```ts
const { data } = useQuery({
  queryKey: ['announcements', daycareId],
  enabled: !!daycareId,           // daycareId가 확정된 후에만 실행
  queryFn: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('daycare_id', daycareId!)
      .order('published_at', { ascending: false })
    if (error) throw error        // TanStack Query의 error state로 전달
    return data
  },
})
```

### 뮤테이션 패턴 (`useMutation` + Supabase)

```ts
const create = useMutation({
  mutationFn: async (draft) => {
    const { error } = await supabase.from('announcements').insert(draft)
    if (error) throw error
  },
  onSuccess: () => qc.invalidateQueries({ queryKey: ['announcements'] }),
  onError: () => setSubmitError('...'),
})
```

### 테이블별 통신 목록

| 테이블 | 파일 | 사용 작업 |
|--------|------|-----------|
| `user_profiles` | `useAuth`, `OnboardingPage`, `CreateDaycare`, `JoinDaycare` | SELECT, INSERT, UPDATE |
| `daycares` | `CreateDaycare`, `JoinDaycare` | INSERT, SELECT |
| `dogs` | `TeacherHomePage`, `AlbumPage`, `GuardianFeedPage`, `DogForm` | SELECT, INSERT |
| `memberships` | `DogForm` | INSERT |
| `daily_reports` | `useReport`, `ReportWritePage`, `ReportCard` | SELECT, INSERT, UPDATE |
| `announcements` | `AnnouncementsPage` | SELECT, INSERT |
| `schedules` | `SchedulePage` | SELECT, INSERT |
| `photos` | `usePhotos`, `AlbumPage` | SELECT, INSERT, DELETE |
| `meal_plans` | `MealPlanPage` | SELECT, UPSERT |
| `invites` | `useInvite` | INSERT, SELECT |

### 특수 쿼리

- **`maybeSingle()`**: 결과가 0개일 때 에러 대신 `null` 반환. `useTodayReport`, `MealPlanPage`에서 사용.
- **`single()`**: 결과가 정확히 1개여야 할 때 사용. 없으면 에러.
- **`upsert()`**: `MealPlanPage`에서 주간 식단 저장 시 사용 (없으면 INSERT, 있으면 UPDATE).
- **RPC (`rpc()`)**: 초대 수락 시 `supabase.rpc('accept_invite', { p_token })` 호출. DB의 `SECURITY DEFINER` 함수가 RLS를 우회해 원자적으로 처리.

---

## 4. 스토리지 — Supabase Storage

사진 업로드/삭제는 `photos` 버킷을 사용합니다.

### 업로드 (`src/hooks/usePhotos.ts`)

```
파일 선택
  → storage.from('photos').upload(path, file)   // 1. Storage에 파일 저장
  → supabase.from('photos').insert({ ... })      // 2. DB에 메타데이터 저장
  → queryClient.invalidateQueries(['photos'])    // 3. 캐시 무효화 → 리렌더
```

- 저장 경로: `{dogId}/{timestamp}.{ext}` — 공백·특수문자를 제거하기 위해 원본 파일명 사용하지 않습니다.
- Storage 업로드가 성공해도 DB insert가 실패하면 고아 파일이 됩니다 (트랜잭션 없음).

### 삭제

```
storage.from('photos').remove([storagePath])    // 1. Storage 파일 삭제
  → supabase.from('photos').delete().eq('id')   // 2. DB 레코드 삭제
```

### 이미지 표시

```ts
const { data } = supabase.storage.from('photos').getPublicUrl(p.storage_path)
// → CDN URL을 동기적으로 생성 (네트워크 호출 없음)
<img src={data.publicUrl} />
```

- `photos` 버킷이 **Public**으로 설정되어 있어야 합니다.

---

## 5. 실시간 — Supabase Realtime

보호자가 알림장을 실시간으로 수신합니다.

**`src/hooks/useRealtime.ts`**

```ts
supabase
  .channel(`reports:${dogId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'daily_reports',
    filter: `dog_id=eq.${dogId}`,   // 해당 강아지 row만 구독
  }, (payload) => {
    if (payload.new?.published_at) {
      qc.invalidateQueries({ queryKey: ['reports', dogId] })
    }
  })
  .subscribe()
```

- `published_at`이 채워지는 UPDATE 이벤트만 처리합니다 (초안 저장 등 다른 UPDATE는 무시).
- 채널 이름에 `dogId`를 포함해 구독 범위를 좁혔습니다.
- 컴포넌트 unmount 시 `supabase.removeChannel(channel)`로 정리합니다.

---

## 6. Edge Functions

두 개의 Deno 함수가 배포되어 있습니다.

### `generate-summary` — AI 알림장 요약

```
SPA → supabase.functions.invoke('generate-summary', { body: reportData })
  → Edge Function (Deno)
    → OpenAI GPT-4o-mini API 호출
    → 1~2문장 한국어 요약 반환
  → SPA: daily_reports.ai_summary에 직접 UPDATE
```

- AI 요약은 선생님이 "생성하기" 버튼을 누를 때 **on-demand**로 생성됩니다.
- Edge Function은 텍스트만 반환하고, DB 저장은 SPA가 직접 합니다.

### `notify-guardian` — 이메일 알림

```
SPA → supabase.functions.invoke('notify-guardian', { body: { report_id } })
  → Edge Function (Deno)
    → daily_reports 조회 (service_role key)
    → auth.admin.getUserById → 보호자 이메일 조회
    → Resend API → 이메일 발송
```

- `service_role key`를 사용해 RLS 없이 `auth.users`에 접근합니다.
- 알림장 발송 버튼 클릭 시 호출됩니다.

---

## 7. 접근 제어 — Row Level Security (RLS)

모든 테이블에 RLS가 활성화되어 있습니다. `anon key`는 공개되어 있으므로 실질적인 보안은 RLS 정책이 담당합니다.

### 핵심 정책 패턴

| 패턴 | 예시 |
|------|------|
| 본인 데이터만 | `user_profiles`: `id = auth.uid()` |
| 같은 유치원 선생님 | `announcements`, `photos`: `user_profiles.daycare_id = table.daycare_id AND role = 'teacher'` |
| 보호자 본인 강아지 | `daily_reports`: `dogs.owner_id = auth.uid()` |
| 토큰 기반 RPC | `accept_invite`: `SECURITY DEFINER`로 RLS 우회 |

---

## 8. 캐시 전략 — TanStack Query

| 동작 | 전략 |
|------|------|
| 데이터 페칭 | `useQuery` — 자동 캐시, staleTime 기본값(0) |
| 뮤테이션 후 | `invalidateQueries` — 관련 캐시 무효화 후 리페치 |
| 실시간 수신 | Realtime payload 확인 후 `invalidateQueries` |
| 조건부 실행 | `enabled: !!dependentValue` — 의존값 확정 후 요청 |

`queryKey` 설계:
```
['announcements', daycareId]     // daycare 단위
['reports', dogId]               // dog 단위
['photos', dogId]                // dog 단위
['profile', userId]              // user 단위
```

---

## 9. 구조적 특이사항 및 주의점

### 장점
- 백엔드 서버 없이 Supabase 하나로 Auth/DB/Storage/Realtime 처리
- 타입 생성(`supabase gen types`)으로 DB 스키마와 TypeScript 타입이 동기화

### 주의점

1. **Storage ↔ DB 비원자성**: 사진 업로드 시 Storage 성공 후 DB insert가 실패하면 고아 파일 발생. 현재 정리 로직 없음.

2. **useAuth 다중 구독**: 여러 컴포넌트가 `useAuth()`를 호출할 때마다 `onAuthStateChange` 구독이 추가됩니다. Context API나 Zustand로 전역 관리하면 구독 1개로 줄일 수 있습니다.

3. **anon key 노출**: 환경변수 `VITE_SUPABASE_ANON_KEY`는 빌드 시 번들에 포함되어 공개됩니다. 이는 Supabase 설계상 정상이지만, RLS 정책이 올바르지 않으면 데이터가 노출될 수 있습니다.

4. **Edge Function 콜드 스타트**: 첫 호출 시 Deno 런타임 시작으로 ~1초 지연 발생 가능.
