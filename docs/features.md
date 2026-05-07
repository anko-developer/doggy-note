# 기능별 작동 방식

## 1. 알림장 작성 (ReportWritePage)

선생님이 강아지의 하루를 기록하는 핵심 페이지.

### 데이터 로드

- `useTodayReport(dogId)`: 오늘 날짜 기준으로 `daily_reports` 테이블 조회
- 오늘 레코드가 없으면 빈 폼으로 시작, 있으면 기존 데이터를 로드

### 입력 항목

| 항목 | 타입 | 설명 |
|------|------|------|
| 기분 | MoodChip | sleepy / neutral / happy / excited |
| 식사 섭취량 | MealChip | none / half / full |
| 사료 브랜드 | 텍스트 | 기본값: 강아지 등록 시 입력한 브랜드 |
| 산책 | 숫자 2개 | 횟수(회), 거리(km) |
| 훈련 | TrainingLog | 명령어 + 시도 횟수 + 성공 횟수 (복수) |
| 선생님 메모 | 텍스트에어리어 | 특이사항 자유 기입 |

### 저장 ("내용 저장")

```
useUpsertReport():
  id 있음 → UPDATE daily_reports
  id 없음 → INSERT daily_reports
           → SELECT로 생성된 id 조회 (RLS 우회)
  onSuccess → ["report", dogId] 쿼리 무효화
```

### AI 요약 생성

저장 후 AI 요약 카드가 활성화된다. [상세 내용 → ai-and-email.md]

### 발송 ("알림장 보내기")

```
AI 요약이 있을 때만 버튼 활성화

usePublishReport():
  UPDATE daily_reports SET published_at = now()
  supabase.functions.invoke('notify-guardian', { report_id }) (비동기, 실패 무시)
  onSuccess → /로 이동
```

---

## 2. 보호자 피드 (GuardianFeedPage)

보호자가 알림장을 받아보는 페이지.

### 데이터 로드

```
1. dogs 테이블에서 owner_id = user.id 인 강아지 조회 (첫 번째만 사용)
2. daily_reports 테이블에서 published_at IS NOT NULL 인 레코드 조회
   (최신순, 20개 제한)
```

### 실시간 갱신

`useReportRealtime(dogId)`가 Supabase Realtime을 구독하여 선생님이 알림장을 발송하면 자동으로 새 데이터를 로드한다. [상세 내용 → realtime.md]

### 알림장 확인

ReportCard의 "확인했어요" 버튼:

```
UPDATE daily_reports SET confirmed_at = now()
onSuccess → ["reports", dogId] 쿼리 무효화
```

확인 후 버튼이 "확인 완료"로 바뀐다.

---

## 3. 공지사항 (AnnouncementsPage)

### 선생님

- 제목 + 본문 입력 → `announcements` 테이블 INSERT
- `published_at` 자동 설정 (현재 시각)

### 모두

- `announcements` 테이블을 `daycare_id` 필터 + 최신순 조회

---

## 4. 일정표 (SchedulePage)

### 선생님

**일정 등록:**
```
제목, 날짜(date), 설명(optional) 입력
schedules 테이블 INSERT
onSuccess → ["schedules"] 쿼리 무효화, 폼 초기화
```

**일정 삭제:**
```
삭제 아이콘 클릭 → 확인 Dialog 표시
"삭제" 클릭 → schedules 테이블 DELETE
onSuccess → ["schedules"] 쿼리 무효화, Dialog 닫힘
```

### 모두

- `schedules` 테이블을 `daycare_id` 필터 + 오늘 이후 날짜(`gte`) + 날짜 오름차순으로 조회

---

## 5. 앨범 (AlbumPage)

### 선생님

**사진 업로드:**
```
파일 선택 (multiple 지원)
경로: {dogId}/{Date.now()}.{확장자}
Storage 'photos' bucket에 upload
photos 테이블 INSERT { dog_id, storage_path }
```

**사진 삭제:**
```
사진 우상단 × 버튼 클릭 → 확인 Dialog 표시
"삭제" 클릭:
  Storage에서 파일 삭제
  photos 테이블 DELETE
onSuccess → ["photos", dogId] 쿼리 무효화, Dialog 닫힘
```

### 모두

- `photos` 테이블을 `dog_id` 필터 + 최신순 + 20개 제한으로 조회
- 메이슨리 레이아웃 (2열)으로 표시
- 보호자는 연결된 강아지 1마리 기준으로 표시

---

## 6. 식단표 (MealPlanPage)

선생님 전용. 주간 단위로 강아지 식단을 관리한다.

### 주 계산

현재 날짜 기준 해당 주의 월요일을 `week_start`로 사용한다.

### 데이터 구조

`meal_plans` 테이블의 `entries` JSON 컬럼:

```json
[
  { "day": "월", "morning": "사료A", "lunch": "사료B", "snack": "간식" },
  { "day": "화", ... },
  ...
]
```

### 저장 방식

UPSERT: `(daycare_id, week_start)` 기준으로 존재하면 UPDATE, 없으면 INSERT.

---

## 7. 강아지 등록 (TeacherHomePage → DogForm)

선생님이 새 강아지를 등록한다.

```
DogForm 입력: 이름(필수), 견종(선택), 사료 브랜드(선택)

1. dogs 테이블 INSERT { daycare_id, name, breed, food_brand }
2. memberships 테이블 INSERT { dog_id, teacher_id }
3. onCreated(dogId) 콜백 → /report/{dogId}/write 로 이동
```

---

## 로딩 UX

모든 페이지에 `useMinLoading` 적용. 데이터 로드 중에는 Skeleton 컴포넌트를 최소 1초간 표시하여 짧은 로딩에도 UI 깜빡임이 없다.

```typescript
const isLoading = useMinLoading(queryLoading, !!data)

if (isLoading) return <SkeletonUI />
return <ActualContent />
```

## 확인 Dialog

시스템 `confirm()` 대신 커스텀 Dialog를 사용한다.

- `SchedulePage`: 일정 삭제 전 확인
- `AlbumPage`: 사진 삭제 전 확인
- `TeacherHomePage`: 초대 링크 복사 완료 안내
