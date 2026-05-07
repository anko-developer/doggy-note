# 데이터 모델

## 테이블 구조

### user_profiles

사용자의 역할과 유치원 소속 정보.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (FK → auth.users) | Supabase Auth 사용자 ID |
| role | text | 'teacher' 또는 'guardian' |
| daycare_id | uuid (FK → daycares) | 소속 유치원 ID |
| display_name | text | 표시 이름 |

---

### daycares

유치원 정보.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| name | text | 유치원 이름 |
| join_code | text | 6자리 합류 코드 (선생님 간 공유) |

---

### dogs

강아지 정보.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| daycare_id | uuid (FK → daycares) | 소속 유치원 |
| owner_id | uuid (FK → auth.users) | 연결된 보호자 (초대 수락 후 설정) |
| name | text | 강아지 이름 |
| breed | text | 견종 (선택) |
| food_brand | text | 사료 브랜드 (선택) |

---

### daily_reports

하루 알림장 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| dog_id | uuid (FK → dogs) | |
| teacher_id | uuid (FK → auth.users) | 작성한 선생님 |
| date | date | 작성 날짜 |
| mood | text | sleepy / neutral / happy / excited |
| meals_eaten | text | none / half / full |
| food_brand_today | text | 오늘 제공한 사료 브랜드 |
| walk_count | integer | 산책 횟수 |
| walk_distance_km | numeric | 산책 거리 (km) |
| training_log | jsonb | `[{ command, attempts, successes }]` 배열 |
| teacher_note | text | 선생님 메모 |
| ai_summary | text | AI 생성 요약문 |
| ai_summary_failed | boolean | AI 생성 실패 여부 |
| published_at | timestamptz | 발송 시각 (null이면 미발송) |
| confirmed_at | timestamptz | 보호자 확인 시각 |

---

### invites

보호자 초대 토큰 (1회용).

| 컬럼 | 타입 | 설명 |
|------|------|------|
| token | uuid (PK) | crypto.randomUUID()로 생성 |
| dog_id | uuid (FK → dogs) | 연결 대상 강아지 |
| daycare_id | uuid (FK → daycares) | |

초대 수락 시 레코드가 삭제된다.

---

### memberships

선생님과 강아지의 관계.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| dog_id | uuid (FK → dogs) | |
| teacher_id | uuid (FK → auth.users) | |

---

### announcements

공지사항.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| daycare_id | uuid (FK → daycares) | |
| teacher_id | uuid (FK → auth.users) | |
| title | text | 제목 |
| body | text | 본문 |
| published_at | timestamptz | 게시 시각 |

---

### schedules

유치원 일정.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| daycare_id | uuid (FK → daycares) | |
| title | text | 일정 제목 |
| event_date | date | 일정 날짜 |
| description | text | 상세 내용 (선택) |

---

### meal_plans

주간 식단표.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| daycare_id | uuid (FK → daycares) | |
| week_start | date | 해당 주의 월요일 |
| entries | jsonb | `[{ day, morning, lunch, snack }]` 배열 |

`(daycare_id, week_start)` 기준으로 UPSERT.

---

### photos

강아지 사진 메타데이터.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid (PK) | |
| dog_id | uuid (FK → dogs) | |
| storage_path | text | Storage 내 파일 경로 |
| taken_at | timestamptz | 업로드 시각 |

---

## Storage

| Bucket | 경로 형식 | 설명 |
|--------|----------|------|
| photos | `{dogId}/{timestamp}.{ext}` | 강아지 사진 |

---

## DB 함수 (RPC)

### accept_invite(p_token TEXT)

초대 토큰을 수락하여 보호자와 강아지를 연결한다.

```sql
1. invites WHERE token = p_token 에서 dog_id, daycare_id 조회
2. dogs SET owner_id = auth.uid() WHERE id = dog_id
3. DELETE FROM invites WHERE token = p_token
```

`SECURITY DEFINER`로 실행되므로 일반 사용자도 호출 가능하며 RLS 제약 없이 동작한다.

---

## TanStack Query 캐시 키 목록

| 키 | 데이터 |
|----|--------|
| `['dogs', daycareId]` | 유치원 강아지 목록 |
| `['my-dogs', userId]` | 보호자의 강아지 |
| `['dog', dogId]` | 강아지 단건 |
| `['report', dogId, today]` | 오늘 알림장 |
| `['reports', dogId]` | 강아지 알림장 목록 |
| `['photos', dogId]` | 강아지 사진 |
| `['announcements', daycareId]` | 유치원 공지 |
| `['schedules', daycareId]` | 유치원 일정 |
| `['meal-plan', daycareId, weekStart]` | 주간 식단 |
