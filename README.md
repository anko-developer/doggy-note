# Doggy-note 🐾

강아지 유치원과 보호자를 연결하는 알림장 앱입니다. 선생님은 강아지의 하루를 기록하고, 보호자는 실시간으로 알림장을 받아볼 수 있습니다.

**배포 URL**: https://doggy-note.vercel.app

---

## 주요 기능

### 선생님
- 강아지 등록 및 보호자 초대 링크 발급
- 알림장 작성 (기분, 식사량, 산책, 훈련 기록, 메모)
- AI 요약 자동 생성 후 보호자에게 발송
- 공지사항·일정·식단 등록
- 앨범에 사진 업로드

### 보호자
- 초대 링크로 강아지와 1-click 연결 (Google 로그인)
- 발송된 알림장 피드 확인 (Realtime 업데이트)
- 공지사항·일정 조회
- 앨범 사진 열람

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4, shadcn/ui |
| Routing | React Router v7 |
| 서버 상태 | TanStack Query v5 |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| AI | OpenAI GPT-4o-mini (Supabase Edge Function) |
| 배포 | Vercel (Frontend), Supabase (Edge Functions) |

---

## 디렉토리 구조

```
doggy-note/
├── src/
│   ├── pages/                  # 라우트 단위 페이지 컴포넌트
│   │   ├── OnboardingPage.tsx      # 로그인 / 역할 선택
│   │   ├── JoinDaycarePage.tsx     # 유치원 생성 또는 코드로 합류
│   │   ├── TeacherHomePage.tsx     # 선생님 홈 (강아지 목록)
│   │   ├── ReportWritePage.tsx     # 알림장 작성
│   │   ├── GuardianFeedPage.tsx    # 보호자 피드 (알림장 수신)
│   │   ├── AnnouncementsPage.tsx   # 공지사항
│   │   ├── SchedulePage.tsx        # 일정표
│   │   ├── MealPlanPage.tsx        # 식단표
│   │   ├── AlbumPage.tsx           # 사진 앨범
│   │   ├── InviteAcceptPage.tsx    # 초대 링크 수락
│   │   └── AuthCallbackPage.tsx    # Google OAuth 콜백
│   ├── components/
│   │   ├── layout/             # AppLayout, TabBar
│   │   ├── reports/            # ReportCard, AISummaryCard, MealChip 등
│   │   ├── dogs/               # DogForm
│   │   ├── onboarding/         # RoleSelect, CreateDaycare, JoinDaycare
│   │   └── ui/                 # shadcn/ui 기본 컴포넌트 (수정 금지)
│   ├── hooks/
│   │   ├── useAuth.ts          # 인증 상태, 역할, daycareId
│   │   ├── useInvite.ts        # 초대 토큰 생성 / 수락
│   │   ├── usePhotos.ts        # 사진 조회 / 업로드
│   │   ├── useRealtime.ts      # Supabase Realtime 구독
│   │   └── useReport.ts        # 알림장 저장 / 발송
│   ├── router/index.tsx        # 라우트 정의
│   ├── types/
│   │   ├── domain.ts           # 앱 도메인 타입 (UserRole, Mood 등)
│   │   └── supabase.ts         # DB 자동 생성 타입 (직접 편집 금지)
│   └── lib/
│       └── supabase.ts         # Supabase 클라이언트
├── supabase/
│   └── functions/
│       └── generate-summary/   # AI 요약 Edge Function (Deno)
├── tests/
│   └── unit/                   # Vitest 단위 테스트
└── docs/                       # 기획 / 설계 문서
```

---

## 로컬 실행

### 사전 조건
- Node.js 20+
- Supabase CLI

### 환경 변수

프로젝트 루트에 `.env.local` 파일 생성:

```env
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

### 설치 및 실행

```bash
npm install
npm run dev
```

### 주요 명령어

```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run test         # 단위 테스트 (watch 모드)
npm run test:run     # 단위 테스트 (1회 실행)
npx tsc --noEmit    # 타입 체크
npx playwright test  # E2E 테스트 (로컬 전용)
```

---

## 아키텍처 결정

- **AI 요약 흐름**: Edge Function은 텍스트만 반환, SPA가 `daily_reports.ai_summary`에 직접 저장 → 발송 전 선생님이 미리보기 가능
- **보호자 초대**: `crypto.randomUUID()` 기반 토큰, `/invite/:token` 경로로 공유 → Google 로그인 후 자동 강아지 연결
- **역할 분리**: `user_profiles.role` (`teacher` / `guardian`)로 구분, 보호자는 `dogs` 테이블을 통해 유치원과 연결
- **Realtime**: `dog_id=eq.{id}` 필터로 구독 범위를 최소화해 불필요한 이벤트 차단

---

## 배포

| 대상 | 방법 |
|------|------|
| Frontend | Vercel — GitHub 저장소 연결, Framework: Vite |
| Edge Function | `supabase functions deploy generate-summary` |
| DB 타입 재생성 | `supabase gen types typescript --project-id <ID> > src/types/supabase.ts` |
| AI API 키 설정 | `supabase secrets set OPENAI_API_KEY=<key>` |
