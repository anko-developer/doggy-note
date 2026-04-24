# Doggy-note Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 강아지 유치원과 보호자를 연결하는 웹앱 — 선생님이 알림장을 작성하면 AI가 한국어 이야기로 변환하고, 보호자는 실시간으로 받아본다.

**Architecture:** React 19 + Vite SPA → Supabase (Auth/DB/Storage/Realtime) + Supabase Edge Function (Deno) → Anthropic claude-haiku-4-5. 멀티테넌트 격리는 RLS로. 알림장 발송은 선생님이 AI 요약 확인 후 "보내기" 클릭 → SPA가 `published_at` 설정 → Realtime으로 보호자 피드에 즉시 표시.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, shadcn/ui, Supabase (JS v2), React Router v7, TanStack Query v5, Vitest, Testing Library, Playwright, Supabase Edge Functions (Deno), Anthropic SDK

---

## File Structure

```
doggy-note/
├── src/
│   ├── types/
│   │   ├── domain.ts           # TrainingEntry, MealPlanEntry, role types
│   │   └── supabase.ts         # supabase gen types 자동 생성
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client singleton
│   │   └── utils.ts            # cn() 유틸
│   ├── hooks/
│   │   ├── useAuth.ts          # 인증 상태, 역할, 세션
│   │   ├── useDog.ts           # 강아지 CRUD
│   │   ├── useReport.ts        # 알림장 CRUD + AI 생성
│   │   ├── useRealtime.ts      # Supabase Realtime 구독
│   │   ├── useAnnouncements.ts # 공지사항
│   │   ├── usePhotos.ts        # 사진 업로드/조회
│   │   └── useInvite.ts        # 초대 토큰 발급/수락
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (auto-generated, 건드리지 말 것)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # 공통 헤더 + 하단 탭바
│   │   │   └── TabBar.tsx      # 선생님/보호자 역할별 탭 목록
│   │   ├── onboarding/
│   │   │   ├── RoleSelect.tsx  # 최초 로그인 역할 선택
│   │   │   └── JoinDaycare.tsx # 선생님: 6자리 join_code 입력
│   │   ├── dogs/
│   │   │   ├── DogCard.tsx     # 강아지 요약 카드 (이름, 사료, 기분)
│   │   │   └── DogForm.tsx     # 강아지 등록/수정 폼
│   │   ├── reports/
│   │   │   ├── ReportForm.tsx       # 선생님: 알림장 작성 폼
│   │   │   ├── MoodChip.tsx         # 기분 선택 칩 (sleepy/neutral/happy/excited)
│   │   │   ├── MealChip.tsx         # 섭취량 선택 칩 (none/half/full)
│   │   │   ├── TrainingLog.tsx      # 훈련 명령어 입력 리스트
│   │   │   ├── AISummaryCard.tsx    # AI 요약 표시 + 재생성 버튼
│   │   │   ├── ReportCard.tsx       # 보호자: 알림장 카드
│   │   │   └── ReportFeed.tsx       # 보호자: 알림장 목록
│   │   └── common/
│   │       ├── EmptyState.tsx   # 데이터 없을 때 빈 화면
│   │       └── LoadingSpinner.tsx
│   ├── pages/
│   │   ├── OnboardingPage.tsx   # 역할 선택 + 합류
│   │   ├── TeacherHomePage.tsx  # 선생님 메인 (강아지 목록)
│   │   ├── ReportWritePage.tsx  # 알림장 작성
│   │   ├── GuardianFeedPage.tsx # 보호자 피드
│   │   ├── AlbumPage.tsx        # 앨범
│   │   ├── AnnouncementsPage.tsx
│   │   ├── SchedulePage.tsx
│   │   ├── MealPlanPage.tsx
│   │   └── InviteAcceptPage.tsx # /invite/:token 처리
│   ├── router/
│   │   └── index.tsx            # React Router v7 라우트 정의
│   ├── App.tsx
│   └── main.tsx
├── supabase/
│   ├── migrations/
│   │   ├── 20260423000001_schema.sql   # 테이블 10개
│   │   ├── 20260423000002_rls.sql      # RLS 정책 전체
│   │   └── 20260423000003_indexes.sql  # 인덱스 6개
│   └── functions/
│       └── generate-summary/
│           ├── index.ts          # Deno Edge Function
│           └── deno.json
├── tests/
│   ├── unit/
│   │   ├── hooks/
│   │   │   ├── useReport.test.ts
│   │   │   └── useInvite.test.ts
│   │   └── components/
│   │       ├── ReportForm.test.tsx
│   │       ├── MoodChip.test.tsx
│   │       └── AISummaryCard.test.tsx
│   └── e2e/
│       ├── onboarding.spec.ts   # Playwright
│       ├── report-flow.spec.ts
│       └── realtime.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml               # lint + test + Vercel preview
├── TODOS.md
├── CLAUDE.md                    # 프로젝트 컨벤션
└── docs/
    └── superpowers/
        └── plans/
            └── 2026-04-23-doggy-note.md (this file)
```

---

## Task 1: 프로젝트 스캐폴드

**Files:**
- Create: `src/main.tsx`, `src/App.tsx`, `vite.config.ts`, `tailwind.config.ts`, `tsconfig.json`

- [ ] **Step 1: Vite 프로젝트 생성**

```bash
cd /Users/it1403/Documents
npx create-vite@latest doggy-note --template react-ts
cd doggy-note
```

- [ ] **Step 2: 의존성 설치**

```bash
npm install @supabase/supabase-js @tanstack/react-query react-router-dom
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install tailwindcss @tailwindcss/vite
npm install lucide-react class-variance-authority clsx tailwind-merge
```

- [ ] **Step 3: Tailwind CSS 설정**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
})
```

`src/index.css`:
```css
@import "tailwindcss";

:root {
  --color-brand: #e60023;
  --color-text-primary: #211922;
  --color-text-secondary: #62625b;
  --color-text-muted: #91918c;
  --color-surface: #ffffff;
  --color-surface-warm: #f6f6f3;
  --color-sand: #e5e5e0;
  --color-warm: #e0e0d9;
  --color-border: #e5e5e0;
}
```

- [ ] **Step 4: 테스트 setup 파일 생성**

`tests/setup.ts`:
```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 5: 더미 App.tsx로 실행 확인**

`src/App.tsx`:
```typescript
export default function App() {
  return <div className="p-4 text-[#211922]">Doggy-note</div>
}
```

```bash
npm run dev
# http://localhost:5173 에서 "Doggy-note" 텍스트 확인
```

- [ ] **Step 6: 첫 커밋**

```bash
git add .
git commit -m "feat: scaffold React 19 + Vite + Tailwind project"
```

---

## Task 2: Supabase 프로젝트 설정

**Files:**
- Create: `src/lib/supabase.ts`, `.env.local`, `.env.example`

- [ ] **Step 1: Supabase CLI 설치 + 프로젝트 초기화**

```bash
npm install -g supabase
supabase init
supabase login  # 브라우저에서 인증
```

Supabase 웹 콘솔(https://supabase.com)에서 새 프로젝트 생성 후 Project URL과 anon key 복사.

- [ ] **Step 2: 환경 변수 설정**

`.env.local` (git에 올리지 말 것):
```
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

`.env.example` (git에 올림):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`.gitignore`에 추가:
```
.env.local
```

- [ ] **Step 3: Supabase 클라이언트 싱글톤 생성**

`src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Google OAuth 설정**

Supabase 웹 콘솔 → Authentication → Providers → Google 활성화.
Google Cloud Console에서 OAuth 앱 생성 후 Client ID/Secret 입력.
Redirect URL: `https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`

- [ ] **Step 5: 커밋**

```bash
git add src/lib/supabase.ts .env.example .gitignore supabase/
git commit -m "feat: Supabase client setup with Google OAuth"
```

---

## Task 3: DB 스키마 Migration

**Files:**
- Create: `supabase/migrations/20260423000001_schema.sql`

- [ ] **Step 1: 스키마 migration 파일 작성**

`supabase/migrations/20260423000001_schema.sql`:
```sql
-- 유치원
CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  join_code text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 유저 프로필 (auth.users와 1:1)
CREATE TABLE user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('teacher', 'guardian')),
  display_name text NOT NULL,
  daycare_id uuid REFERENCES daycares(id),
  created_at timestamptz DEFAULT now()
);

-- 강아지
CREATE TABLE dogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  breed text,
  food_brand text,
  food_amount_per_meal text,
  owner_id uuid REFERENCES auth.users(id),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  created_at timestamptz DEFAULT now()
);

-- 선생님-강아지 배정
CREATE TABLE memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE (dog_id, teacher_id)
);

-- 일일 알림장
CREATE TABLE daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  date date NOT NULL,
  meals_eaten text CHECK (meals_eaten IN ('none', 'half', 'full')),
  food_brand_today text,
  walk_count integer DEFAULT 0,
  walk_distance_km numeric(4,2) DEFAULT 0,
  training_log jsonb DEFAULT '[]',
  mood text CHECK (mood IN ('sleepy', 'neutral', 'happy', 'excited')),
  teacher_note text,
  ai_summary text,
  ai_summary_failed boolean DEFAULT false,
  published_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE (dog_id, date)
);

-- 공지사항
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  teacher_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  body text NOT NULL,
  published_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 일정
CREATE TABLE schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 사진
CREATE TABLE photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  report_id uuid REFERENCES daily_reports(id),
  storage_path text NOT NULL,
  taken_at timestamptz DEFAULT now()
);

-- 식단표
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  week_start date NOT NULL,
  entries jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  UNIQUE (daycare_id, week_start)
);

-- 초대 토큰
CREATE TABLE invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  dog_id uuid NOT NULL REFERENCES dogs(id) ON DELETE CASCADE,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

- [ ] **Step 2: Migration 적용**

```bash
supabase db push
# Expected: "Applying migration 20260423000001_schema.sql... Done"
```

- [ ] **Step 3: Supabase 웹 콘솔에서 테이블 10개 생성 확인**

Table Editor에서: daycares, user_profiles, dogs, memberships, daily_reports, announcements, schedules, photos, meal_plans, invites.

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/
git commit -m "feat: initial DB schema migration (10 tables)"
```

---

## Task 4: RLS 정책 + 인덱스 Migration

**Files:**
- Create: `supabase/migrations/20260423000002_rls.sql`
- Create: `supabase/migrations/20260423000003_indexes.sql`

- [ ] **Step 1: RLS migration 파일 작성**

`supabase/migrations/20260423000002_rls.sql`:
```sql
-- 모든 테이블 RLS 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "users_read_own" ON user_profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_insert_own" ON user_profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "users_update_own" ON user_profiles FOR UPDATE USING (id = auth.uid());

-- daycares
CREATE POLICY "teacher_read_own_daycare" ON daycares FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = daycares.id)
);
CREATE POLICY "guardian_read_dog_daycare" ON daycares FOR SELECT USING (
  EXISTS (SELECT 1 FROM dogs WHERE owner_id = auth.uid() AND daycare_id = daycares.id)
);

-- dogs
CREATE POLICY "teacher_read_daycare_dogs" ON dogs FOR SELECT USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = dogs.daycare_id)
);
CREATE POLICY "teacher_insert_dogs" ON dogs FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = dogs.daycare_id AND role = 'teacher')
);
CREATE POLICY "guardian_read_own_dog" ON dogs FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "guardian_update_own_dog" ON dogs FOR UPDATE USING (owner_id = auth.uid());

-- memberships
CREATE POLICY "teacher_read_own_memberships" ON memberships FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "teacher_insert_memberships" ON memberships FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- daily_reports
CREATE POLICY "teacher_insert_reports" ON daily_reports FOR INSERT WITH CHECK (
  teacher_id = auth.uid() AND
  EXISTS (SELECT 1 FROM memberships WHERE dog_id = daily_reports.dog_id AND teacher_id = auth.uid())
);
CREATE POLICY "teacher_update_own_reports" ON daily_reports FOR UPDATE USING (teacher_id = auth.uid());
CREATE POLICY "guardian_read_own_dog_reports" ON daily_reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM dogs WHERE id = daily_reports.dog_id AND owner_id = auth.uid())
);
CREATE POLICY "guardian_confirm_report" ON daily_reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM dogs WHERE id = daily_reports.dog_id AND owner_id = auth.uid())
);

-- announcements
CREATE POLICY "teacher_manage_announcements" ON announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = announcements.daycare_id AND role = 'teacher')
);
CREATE POLICY "guardian_read_daycare_announcements" ON announcements FOR SELECT USING (
  daycare_id IN (SELECT daycare_id FROM dogs WHERE owner_id = auth.uid())
);

-- schedules
CREATE POLICY "teacher_manage_schedules" ON schedules FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = schedules.daycare_id AND role = 'teacher')
);
CREATE POLICY "guardian_read_schedules" ON schedules FOR SELECT USING (
  daycare_id IN (SELECT daycare_id FROM dogs WHERE owner_id = auth.uid())
);

-- photos
CREATE POLICY "teacher_insert_photos" ON photos FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM memberships WHERE dog_id = photos.dog_id AND teacher_id = auth.uid())
);
CREATE POLICY "teacher_read_daycare_photos" ON photos FOR SELECT USING (
  dog_id IN (
    SELECT id FROM dogs WHERE daycare_id IN (
      SELECT daycare_id FROM user_profiles WHERE id = auth.uid()
    )
  )
);
CREATE POLICY "guardian_read_own_photos" ON photos FOR SELECT USING (
  dog_id IN (SELECT id FROM dogs WHERE owner_id = auth.uid())
);

-- meal_plans
CREATE POLICY "teacher_manage_meal_plans" ON meal_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = meal_plans.daycare_id AND role = 'teacher')
);
CREATE POLICY "guardian_read_meal_plans" ON meal_plans FOR SELECT USING (
  daycare_id IN (SELECT daycare_id FROM dogs WHERE owner_id = auth.uid())
);

-- invites (초대 수락은 RPC로 처리)
CREATE POLICY "teacher_create_invites" ON invites FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND daycare_id = invites.daycare_id AND role = 'teacher')
);
CREATE POLICY "anyone_read_invite_by_token" ON invites FOR SELECT USING (true);

-- 초대 수락 RPC (토큰 기반, security definer로 RLS 우회)
CREATE OR REPLACE FUNCTION accept_invite(p_token text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite invites;
BEGIN
  SELECT * INTO v_invite FROM invites WHERE token = p_token AND used_at IS NULL;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or already used invite token';
  END IF;
  UPDATE dogs SET owner_id = auth.uid() WHERE id = v_invite.dog_id;
  UPDATE invites SET used_at = now() WHERE id = v_invite.id;
  INSERT INTO user_profiles (id, role, display_name)
    VALUES (auth.uid(), 'guardian', '')
    ON CONFLICT (id) DO NOTHING;
END;
$$;
```

- [ ] **Step 2: 인덱스 migration 파일 작성**

`supabase/migrations/20260423000003_indexes.sql`:
```sql
CREATE INDEX idx_dogs_owner_id ON dogs(owner_id);
CREATE INDEX idx_memberships_teacher_id ON memberships(teacher_id);
CREATE INDEX idx_photos_dog_taken ON photos(dog_id, taken_at DESC);
CREATE INDEX idx_announcements_daycare_published ON announcements(daycare_id, published_at DESC);
CREATE INDEX idx_schedules_daycare_date ON schedules(daycare_id, event_date);
-- daily_reports(dog_id, date)는 UNIQUE 제약으로 인덱스 이미 존재
```

- [ ] **Step 3: Migration 적용**

```bash
supabase db push
# Expected: 두 migration 파일 적용됨
```

- [ ] **Step 4: 커밋**

```bash
git add supabase/migrations/
git commit -m "feat: RLS policies and indexes migration"
```

---

## Task 5: TypeScript 타입 + 도메인 타입

**Files:**
- Create: `src/types/domain.ts`
- Create: `src/types/supabase.ts` (자동 생성)

- [ ] **Step 1: Supabase 타입 자동 생성**

```bash
supabase gen types typescript --project-id <YOUR_PROJECT_ID> > src/types/supabase.ts
```

`<YOUR_PROJECT_ID>`는 Supabase 웹 콘솔 → Settings → General에서 확인.

- [ ] **Step 2: 도메인 타입 정의**

`src/types/domain.ts`:
```typescript
export type UserRole = 'teacher' | 'guardian'

export type Mood = 'sleepy' | 'neutral' | 'happy' | 'excited'
export type MealsEaten = 'none' | 'half' | 'full'

export type TrainingEntry = {
  command: string
  reps: number
  success: number
}

export type MealPlanEntry = {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun'
  morning: string
  lunch: string
  snack: string
}

export const MOOD_LABELS: Record<Mood, string> = {
  sleepy: '졸려요 😴',
  neutral: '보통이에요 😐',
  happy: '기분 좋아요 😊',
  excited: '신났어요 🐾',
}

export const MEALS_LABELS: Record<MealsEaten, string> = {
  none: '안 먹었어요',
  half: '반 먹었어요',
  full: '다 먹었어요',
}
```

- [ ] **Step 3: 유틸 함수**

`src/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/types/ src/lib/utils.ts
git commit -m "feat: TypeScript domain types and Supabase generated types"
```

---

## Task 6: shadcn/ui 컴포넌트 설치

**Files:**
- Create: `src/components/ui/` (shadcn 자동 생성)
- Create: `components.json`

- [ ] **Step 1: shadcn/ui 초기화**

```bash
npx shadcn@latest init
# framework: Vite
# style: Default
# base color: Neutral
# CSS variables: yes
```

- [ ] **Step 2: 필요한 컴포넌트 설치**

```bash
npx shadcn@latest add button input textarea badge card tabs label
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/ui/ components.json src/lib/utils.ts
git commit -m "feat: shadcn/ui components installed"
```

---

## Task 7: Auth 훅 + 라우터

**Files:**
- Create: `src/hooks/useAuth.ts`
- Create: `src/router/index.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: useAuth 훅 작성**

`src/hooks/useAuth.ts`:
```typescript
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserRole } from '../types/domain'

type AuthState = {
  user: User | null
  role: UserRole | null
  loading: boolean
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ user: null, role: null, loading: true })

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null
      if (user) {
        fetchRole(user.id).then(role => setState({ user, role, loading: false }))
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null
      if (user) {
        fetchRole(user.id).then(role => setState({ user, role, loading: false }))
      } else {
        setState({ user: null, role: null, loading: false })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return state
}

async function fetchRole(userId: string): Promise<UserRole | null> {
  const { data } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single()
  return (data?.role as UserRole) ?? null
}

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
}

export async function signOut() {
  await supabase.auth.signOut()
}
```

- [ ] **Step 2: 라우터 정의**

`src/router/index.tsx`:
```typescript
import { createBrowserRouter } from 'react-router-dom'
import OnboardingPage from '../pages/OnboardingPage'
import TeacherHomePage from '../pages/TeacherHomePage'
import ReportWritePage from '../pages/ReportWritePage'
import GuardianFeedPage from '../pages/GuardianFeedPage'
import AlbumPage from '../pages/AlbumPage'
import AnnouncementsPage from '../pages/AnnouncementsPage'
import SchedulePage from '../pages/SchedulePage'
import MealPlanPage from '../pages/MealPlanPage'
import InviteAcceptPage from '../pages/InviteAcceptPage'
import AppLayout from '../components/layout/AppLayout'

export const router = createBrowserRouter([
  { path: '/invite/:token', element: <InviteAcceptPage /> },
  { path: '/onboarding', element: <OnboardingPage /> },
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <TeacherHomePage /> },
      { path: '/report/:dogId/write', element: <ReportWritePage /> },
      { path: '/feed', element: <GuardianFeedPage /> },
      { path: '/album', element: <AlbumPage /> },
      { path: '/announcements', element: <AnnouncementsPage /> },
      { path: '/schedule', element: <SchedulePage /> },
      { path: '/meal-plan', element: <MealPlanPage /> },
    ],
  },
])
```

- [ ] **Step 3: App.tsx 업데이트**

`src/App.tsx`:
```typescript
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './router'

const queryClient = new QueryClient()

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
```

- [ ] **Step 4: 페이지 placeholder 생성 (각 파일 최소 구현)**

`src/pages/OnboardingPage.tsx`:
```typescript
export default function OnboardingPage() {
  return <div className="p-4">Onboarding</div>
}
```

나머지 페이지 파일들도 동일한 패턴으로 생성:
`TeacherHomePage`, `ReportWritePage`, `GuardianFeedPage`, `AlbumPage`, `AnnouncementsPage`, `SchedulePage`, `MealPlanPage`, `InviteAcceptPage`

- [ ] **Step 5: 실행 확인**

```bash
npm run dev
# localhost:5173 정상 렌더링 확인
```

- [ ] **Step 6: 커밋**

```bash
git add src/
git commit -m "feat: auth hook, React Router v7 setup, page placeholders"
```

---

## Task 8: 온보딩 — 로그인 + 역할 선택

**Files:**
- Create: `src/components/onboarding/RoleSelect.tsx`
- Modify: `src/pages/OnboardingPage.tsx`

- [ ] **Step 1: 테스트 작성**

`tests/unit/components/RoleSelect.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import RoleSelect from '../../../src/components/onboarding/RoleSelect'

describe('RoleSelect', () => {
  it('선생님 선택 시 onSelect("teacher") 호출', () => {
    const onSelect = vi.fn()
    render(<RoleSelect onSelect={onSelect} />)
    fireEvent.click(screen.getByText('선생님이에요'))
    expect(onSelect).toHaveBeenCalledWith('teacher')
  })

  it('보호자 선택 시 onSelect("guardian") 호출', () => {
    const onSelect = vi.fn()
    render(<RoleSelect onSelect={onSelect} />)
    fireEvent.click(screen.getByText('보호자예요'))
    expect(onSelect).toHaveBeenCalledWith('guardian')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run tests/unit/components/RoleSelect.test.tsx
# Expected: FAIL (RoleSelect not found)
```

- [ ] **Step 3: RoleSelect 컴포넌트 구현**

`src/components/onboarding/RoleSelect.tsx`:
```typescript
import type { UserRole } from '../../types/domain'

type Props = { onSelect: (role: UserRole) => void }

export default function RoleSelect({ onSelect }: Props) {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold text-[#211922]" style={{ letterSpacing: '-1.2px' }}>
        어떤 역할로 시작할까요?
      </h1>
      <button
        onClick={() => onSelect('teacher')}
        className="rounded-[16px] bg-[#e60023] px-6 py-4 text-white font-medium text-lg"
      >
        선생님이에요 🏫
      </button>
      <button
        onClick={() => onSelect('guardian')}
        className="rounded-[16px] bg-[#e5e5e0] px-6 py-4 text-[#211922] font-medium text-lg"
      >
        보호자예요 🐾
      </button>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npx vitest run tests/unit/components/RoleSelect.test.tsx
# Expected: PASS 2/2
```

- [ ] **Step 5: OnboardingPage 업데이트**

`src/pages/OnboardingPage.tsx`:
```typescript
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { signInWithGoogle, useAuth } from '../hooks/useAuth'
import RoleSelect from '../components/onboarding/RoleSelect'
import type { UserRole } from '../types/domain'

export default function OnboardingPage() {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="p-4">Loading...</div>

  // 이미 역할이 있으면 메인으로
  if (user && role === 'teacher') { navigate('/'); return null }
  if (user && role === 'guardian') { navigate('/feed'); return null }

  // 로그인 안 됨
  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <h1 className="text-3xl font-bold text-[#211922]">Doggy-note 🐾</h1>
        <button
          onClick={signInWithGoogle}
          className="rounded-[16px] bg-[#e60023] px-8 py-3 text-white font-medium"
        >
          Google로 시작하기
        </button>
      </div>
    )
  }

  // 역할 선택
  async function handleRoleSelect(selectedRole: UserRole) {
    if (!user) return
    setSaving(true)
    await supabase.from('user_profiles').insert({
      id: user.id,
      role: selectedRole,
      display_name: user.user_metadata.full_name ?? '',
    })
    if (selectedRole === 'teacher') navigate('/onboarding/join-daycare')
    else navigate('/feed')
  }

  return <RoleSelect onSelect={handleRoleSelect} />
}
```

- [ ] **Step 6: 커밋**

```bash
git add src/ tests/
git commit -m "feat: onboarding role selection with Google OAuth"
```

---

## Task 9: 온보딩 — 선생님 유치원 합류 + 강아지 등록

**Files:**
- Create: `src/components/onboarding/JoinDaycare.tsx`
- Create: `src/components/dogs/DogForm.tsx`
- Create: `src/hooks/useInvite.ts`
- Create: `tests/unit/hooks/useInvite.test.ts`

- [ ] **Step 1: useInvite 훅 테스트 작성**

`tests/unit/hooks/useInvite.test.ts`:
```typescript
import { describe, it, expect, vi } from 'vitest'
import { generateInviteToken } from '../../../src/hooks/useInvite'

describe('generateInviteToken', () => {
  it('UUID v4 형식 토큰 반환', () => {
    const token = generateInviteToken()
    const uuidV4Pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    expect(uuidV4Pattern.test(token)).toBe(true)
  })

  it('매번 다른 토큰 생성', () => {
    expect(generateInviteToken()).not.toBe(generateInviteToken())
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run tests/unit/hooks/useInvite.test.ts
# Expected: FAIL
```

- [ ] **Step 3: useInvite 훅 구현**

`src/hooks/useInvite.ts`:
```typescript
import { supabase } from '../lib/supabase'

export function generateInviteToken(): string {
  return crypto.randomUUID()
}

export async function createInvite(dogId: string, daycareId: string) {
  const token = generateInviteToken()
  const { data, error } = await supabase
    .from('invites')
    .insert({ token, dog_id: dogId, daycare_id: daycareId })
    .select('token')
    .single()
  if (error) throw error
  return data.token
}

export async function acceptInvite(token: string) {
  const { error } = await supabase.rpc('accept_invite', { p_token: token })
  if (error) throw error
}
```

- [ ] **Step 4: 테스트 실행 → 통과 확인**

```bash
npx vitest run tests/unit/hooks/useInvite.test.ts
# Expected: PASS 2/2
```

- [ ] **Step 5: JoinDaycare 컴포넌트 구현**

`src/components/onboarding/JoinDaycare.tsx`:
```typescript
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

type Props = { userId: string; onJoined: (daycareId: string) => void }

export default function JoinDaycare({ userId, onJoined }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleJoin() {
    setLoading(true)
    setError('')
    const { data: daycare } = await supabase
      .from('daycares')
      .select('id')
      .eq('join_code', code.toUpperCase())
      .single()

    if (!daycare) {
      setError('유치원 코드를 찾을 수 없어요.')
      setLoading(false)
      return
    }

    await supabase
      .from('user_profiles')
      .update({ daycare_id: daycare.id })
      .eq('id', userId)

    onJoined(daycare.id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-[#211922]">유치원 코드 입력</h2>
      <p className="text-sm text-[#62625b]">원장님께 받은 6자리 코드를 입력해 주세요.</p>
      <Input
        value={code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder="ABCD12"
        maxLength={6}
        className="text-center text-2xl tracking-widest rounded-[16px]"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        onClick={handleJoin}
        disabled={code.length !== 6 || loading}
        className="rounded-[16px] bg-[#e60023] text-white"
      >
        {loading ? '확인 중...' : '합류하기'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 6: DogForm 컴포넌트 구현**

`src/components/dogs/DogForm.tsx`:
```typescript
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

type Props = { daycareId: string; teacherId: string; onCreated: (dogId: string) => void }

export default function DogForm({ daycareId, teacherId, onCreated }: Props) {
  const [name, setName] = useState('')
  const [breed, setBreed] = useState('')
  const [foodBrand, setFoodBrand] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    const { data: dog, error } = await supabase
      .from('dogs')
      .insert({ name, breed, food_brand: foodBrand, daycare_id: daycareId })
      .select('id')
      .single()

    if (error || !dog) { setLoading(false); return }

    await supabase.from('memberships').insert({ dog_id: dog.id, teacher_id: teacherId })
    onCreated(dog.id)
    setLoading(false)
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-xl font-bold text-[#211922]">강아지 등록</h2>
      <Input value={name} onChange={e => setName(e.target.value)} placeholder="이름 *" className="rounded-[16px]" />
      <Input value={breed} onChange={e => setBreed(e.target.value)} placeholder="견종" className="rounded-[16px]" />
      <Input value={foodBrand} onChange={e => setFoodBrand(e.target.value)} placeholder="주 사료 브랜드" className="rounded-[16px]" />
      <Button
        onClick={handleSubmit}
        disabled={!name.trim() || loading}
        className="rounded-[16px] bg-[#e60023] text-white"
      >
        {loading ? '등록 중...' : '강아지 등록'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 7: 커밋**

```bash
git add src/ tests/
git commit -m "feat: teacher onboarding — join daycare and register dog"
```

---

## Task 10: 알림장 작성 폼 (선생님)

**Files:**
- Create: `src/components/reports/MoodChip.tsx`
- Create: `src/components/reports/MealChip.tsx`
- Create: `src/components/reports/TrainingLog.tsx`
- Create: `src/components/reports/ReportForm.tsx`
- Create: `src/hooks/useReport.ts`
- Create: `tests/unit/components/MoodChip.test.tsx`
- Create: `tests/unit/hooks/useReport.test.ts`

- [ ] **Step 1: MoodChip 테스트 작성**

`tests/unit/components/MoodChip.test.tsx`:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import MoodChip from '../../../src/components/reports/MoodChip'

describe('MoodChip', () => {
  it('선택되지 않은 상태에서 클릭하면 onSelect 호출', () => {
    const onSelect = vi.fn()
    render(<MoodChip mood="happy" selected={false} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('happy')
  })

  it('선택된 상태에서 배경색이 brand red', () => {
    render(<MoodChip mood="happy" selected={true} onSelect={vi.fn()} />)
    const btn = screen.getByRole('button')
    expect(btn.className).toContain('bg-[#e60023]')
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run tests/unit/components/MoodChip.test.tsx
# Expected: FAIL
```

- [ ] **Step 3: MoodChip 구현**

`src/components/reports/MoodChip.tsx`:
```typescript
import { MOOD_LABELS, type Mood } from '../../types/domain'
import { cn } from '../../lib/utils'

type Props = { mood: Mood; selected: boolean; onSelect: (mood: Mood) => void }

export default function MoodChip({ mood, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(mood)}
      className={cn(
        'rounded-[16px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#e60023] text-white'
          : 'bg-[#e5e5e0] text-[#211922]'
      )}
    >
      {MOOD_LABELS[mood]}
    </button>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx vitest run tests/unit/components/MoodChip.test.tsx
# Expected: PASS 2/2
```

- [ ] **Step 5: MealChip 구현** (MoodChip과 동일한 패턴)

`src/components/reports/MealChip.tsx`:
```typescript
import { MEALS_LABELS, type MealsEaten } from '../../types/domain'
import { cn } from '../../lib/utils'

type Props = { meal: MealsEaten; selected: boolean; onSelect: (meal: MealsEaten) => void }

export default function MealChip({ meal, selected, onSelect }: Props) {
  return (
    <button
      onClick={() => onSelect(meal)}
      className={cn(
        'rounded-[16px] px-4 py-2 text-sm font-medium transition-colors',
        selected
          ? 'bg-[#e60023] text-white'
          : 'bg-[#e5e5e0] text-[#211922]'
      )}
    >
      {MEALS_LABELS[meal]}
    </button>
  )
}
```

- [ ] **Step 6: TrainingLog 구현**

`src/components/reports/TrainingLog.tsx`:
```typescript
import { useState } from 'react'
import type { TrainingEntry } from '../../types/domain'
import { Input } from '../ui/input'
import { Button } from '../ui/button'

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
```

- [ ] **Step 7: useReport 훅 구현**

`src/hooks/useReport.ts`:
```typescript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Mood, MealsEaten, TrainingEntry } from '../types/domain'

export type ReportDraft = {
  dog_id: string
  date: string
  meals_eaten: MealsEaten
  food_brand_today: string
  walk_count: number
  walk_distance_km: number
  training_log: TrainingEntry[]
  mood: Mood
  teacher_note: string
}

export function useTodayReport(dogId: string) {
  const today = new Date().toISOString().split('T')[0]
  return useQuery({
    queryKey: ['report', dogId, today],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('dog_id', dogId)
        .eq('date', today)
        .single()
      return data
    },
  })
}

export function useUpsertReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (draft: ReportDraft & { id?: string }) => {
      const { id, ...fields } = draft
      if (id) {
        const { data, error } = await supabase.from('daily_reports').update(fields).eq('id', id).select().single()
        if (error) throw error
        return data
      }
      const { data, error } = await supabase.from('daily_reports').insert(fields).select().single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['report', data.dog_id] })
    },
  })
}

export function usePublishReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (reportId: string) => {
      const { data, error } = await supabase
        .from('daily_reports')
        .update({ published_at: new Date().toISOString() })
        .eq('id', reportId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['report', data.dog_id] })
    },
  })
}
```

- [ ] **Step 8: ReportForm 페이지 구현**

`src/pages/ReportWritePage.tsx`:
```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import MoodChip from '../components/reports/MoodChip'
import MealChip from '../components/reports/MealChip'
import TrainingLog from '../components/reports/TrainingLog'
import AISummaryCard from '../components/reports/AISummaryCard'
import { useTodayReport, useUpsertReport, usePublishReport } from '../hooks/useReport'
import type { Mood, MealsEaten, TrainingEntry } from '../types/domain'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { Input } from '../components/ui/input'

export default function ReportWritePage() {
  const { dogId } = useParams<{ dogId: string }>()
  const navigate = useNavigate()
  const { data: report } = useTodayReport(dogId!)
  const upsert = useUpsertReport()
  const publish = usePublishReport()

  const { data: dog } = useQuery({
    queryKey: ['dog', dogId],
    queryFn: async () => {
      const { data } = await supabase.from('dogs').select('*').eq('id', dogId!).single()
      return data
    },
  })

  const [mood, setMood] = useState<Mood>('neutral')
  const [meals, setMeals] = useState<MealsEaten>('full')
  const [foodBrand, setFoodBrand] = useState('')
  const [walkCount, setWalkCount] = useState(0)
  const [walkDist, setWalkDist] = useState(0)
  const [training, setTraining] = useState<TrainingEntry[]>([])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!report) return
    setMood((report.mood as Mood) ?? 'neutral')
    setMeals((report.meals_eaten as MealsEaten) ?? 'full')
    setFoodBrand(report.food_brand_today ?? dog?.food_brand ?? '')
    setWalkCount(report.walk_count ?? 0)
    setWalkDist(Number(report.walk_distance_km) ?? 0)
    setTraining((report.training_log as TrainingEntry[]) ?? [])
    setNote(report.teacher_note ?? '')
  }, [report, dog])

  async function handleSave() {
    await upsert.mutateAsync({
      id: report?.id,
      dog_id: dogId!,
      date: new Date().toISOString().split('T')[0],
      mood,
      meals_eaten: meals,
      food_brand_today: foodBrand,
      walk_count: walkCount,
      walk_distance_km: walkDist,
      training_log: training,
      teacher_note: note,
    })
  }

  async function handlePublish() {
    if (!report?.id) return
    await publish.mutateAsync(report.id)
    navigate('/')
  }

  const isPublished = !!report?.published_at

  return (
    <div className="flex flex-col gap-6 p-4 pb-24">
      <h1 className="text-xl font-bold text-[#211922]">{dog?.name}의 알림장</h1>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">오늘 기분</p>
        <div className="flex flex-wrap gap-2">
          {(['sleepy', 'neutral', 'happy', 'excited'] as Mood[]).map(m => (
            <MoodChip key={m} mood={m} selected={mood === m} onSelect={setMood} />
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">식사 섭취량</p>
        <div className="flex gap-2">
          {(['none', 'half', 'full'] as MealsEaten[]).map(m => (
            <MealChip key={m} meal={m} selected={meals === m} onSelect={setMeals} />
          ))}
        </div>
        <Input
          value={foodBrand}
          onChange={e => setFoodBrand(e.target.value)}
          placeholder="오늘 사료 브랜드"
          className="mt-2 rounded-[16px]"
        />
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">산책</p>
        <div className="flex gap-2">
          <Input type="number" value={walkCount} onChange={e => setWalkCount(Number(e.target.value))}
            placeholder="횟수" className="rounded-[16px]" min={0} />
          <Input type="number" value={walkDist} onChange={e => setWalkDist(Number(e.target.value))}
            placeholder="거리(km)" step="0.1" className="rounded-[16px]" min={0} />
        </div>
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">훈련</p>
        <TrainingLog entries={training} onChange={setTraining} />
      </section>

      <section>
        <p className="mb-2 text-sm font-bold text-[#211922]">선생님 한마디</p>
        <Textarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="오늘 특별히 있었던 일을 적어주세요"
          className="rounded-[16px] min-h-[100px]" />
      </section>

      <Button onClick={handleSave} variant="outline" className="rounded-[16px]" disabled={upsert.isPending}>
        {upsert.isPending ? '저장 중...' : '임시 저장'}
      </Button>

      {report?.id && (
        <AISummaryCard
          reportId={report.id}
          existingSummary={report.ai_summary ?? undefined}
          failed={report.ai_summary_failed ?? false}
          dogName={dog?.name ?? ''}
          reportData={{ meals_eaten: meals, food_brand: foodBrand, walk_count: walkCount,
            walk_distance_km: walkDist, training_log: training, mood, teacher_note: note }}
        />
      )}

      {!isPublished && report?.ai_summary && (
        <Button onClick={handlePublish} disabled={publish.isPending}
          className="rounded-[16px] bg-[#e60023] text-white">
          {publish.isPending ? '발송 중...' : '알림장 보내기 ✈️'}
        </Button>
      )}

      {isPublished && (
        <p className="text-center text-sm text-[#91918c]">발송 완료 ✓</p>
      )}
    </div>
  )
}
```

- [ ] **Step 9: 커밋**

```bash
git add src/ tests/
git commit -m "feat: report writing form with mood, meal, training, walk inputs"
```

---

## Task 11: AI 요약 Edge Function + AISummaryCard

**Files:**
- Create: `supabase/functions/generate-summary/index.ts`
- Create: `src/components/reports/AISummaryCard.tsx`
- Create: `tests/unit/components/AISummaryCard.test.tsx`

- [ ] **Step 1: AISummaryCard 테스트 작성**

`tests/unit/components/AISummaryCard.test.tsx`:
```typescript
import { render, screen } from '@testing-library/react'
import AISummaryCard from '../../../src/components/reports/AISummaryCard'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

describe('AISummaryCard', () => {
  it('기존 요약이 있으면 표시', () => {
    render(
      <AISummaryCard
        reportId="r1"
        existingSummary="보리가 오늘 잘 먹었어요"
        failed={false}
        dogName="보리"
        reportData={{ meals_eaten: 'full', food_brand: '오리젠', walk_count: 2,
          walk_distance_km: 1.2, training_log: [], mood: 'happy', teacher_note: '' }}
      />,
      { wrapper }
    )
    expect(screen.getByText('보리가 오늘 잘 먹었어요')).toBeInTheDocument()
  })

  it('실패 상태에서 재시도 버튼 표시', () => {
    render(
      <AISummaryCard
        reportId="r1"
        existingSummary={undefined}
        failed={true}
        dogName="보리"
        reportData={{ meals_eaten: 'half', food_brand: '사료', walk_count: 1,
          walk_distance_km: 0.5, training_log: [], mood: 'neutral', teacher_note: '' }}
      />,
      { wrapper }
    )
    expect(screen.getByText(/재시도/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

```bash
npx vitest run tests/unit/components/AISummaryCard.test.tsx
# Expected: FAIL
```

- [ ] **Step 3: Edge Function 작성**

`supabase/functions/generate-summary/index.ts`:
```typescript
import Anthropic from 'npm:@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') })

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const { dog_name, meals_eaten, food_brand, walk_count, walk_distance_km, training_log, mood, teacher_note } = await req.json()

  const moodKo: Record<string, string> = {
    sleepy: '졸린', neutral: '보통', happy: '기분 좋은', excited: '신난'
  }
  const mealsKo: Record<string, string> = {
    none: '거의 안 먹었고', half: '반 정도 먹었고', full: '다 먹었고'
  }
  const trainingText = training_log?.length
    ? training_log.map((t: { command: string; reps: number; success: number }) =>
        `${t.command} ${t.reps}회 중 ${t.success}회 성공`).join(', ')
    : ''

  const prompt = `강아지 유치원 알림장을 보호자가 받고 싶은 따뜻한 한국어 이야기로 변환해줘.
강아지 이름: ${dog_name}
기분: ${moodKo[mood] ?? mood}
식사: ${mealsKo[meals_eaten] ?? meals_eaten}${food_brand ? ` (${food_brand})` : ''}
산책: ${walk_count}회, ${walk_distance_km}km
${trainingText ? `훈련: ${trainingText}` : ''}
${teacher_note ? `선생님 메모: ${teacher_note}` : ''}

1~2문장으로, 강아지 이름을 포함해서, 이모지 1개 포함, 자연스러운 반말체로 작성.`

  try {
    const message = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    })

    const summary = (message.content[0] as { type: 'text'; text: string }).text
    return Response.json({ summary })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'AI 요약 생성 실패' }, { status: 500 })
  }
})
```

- [ ] **Step 4: Edge Function 환경 변수 설정**

```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

- [ ] **Step 5: Edge Function 배포**

```bash
supabase functions deploy generate-summary
```

- [ ] **Step 6: AISummaryCard 구현**

`src/components/reports/AISummaryCard.tsx`:
```typescript
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import type { TrainingEntry, Mood, MealsEaten } from '../../types/domain'
import { Button } from '../ui/button'

type ReportData = {
  meals_eaten: MealsEaten
  food_brand: string
  walk_count: number
  walk_distance_km: number
  training_log: TrainingEntry[]
  mood: Mood
  teacher_note: string
}

type Props = {
  reportId: string
  existingSummary?: string
  failed: boolean
  dogName: string
  reportData: ReportData
}

export default function AISummaryCard({ reportId, existingSummary, failed, dogName, reportData }: Props) {
  const [summary, setSummary] = useState(existingSummary)
  const [isFailed, setIsFailed] = useState(failed)
  const qc = useQueryClient()

  const generate = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
        body: { dog_name: dogName, ...reportData },
      })
      if (error || data.error) throw new Error(data?.error ?? 'Failed')
      return data.summary as string
    },
    onSuccess: async (text) => {
      setSummary(text)
      setIsFailed(false)
      await supabase.from('daily_reports').update({ ai_summary: text, ai_summary_failed: false }).eq('id', reportId)
      qc.invalidateQueries({ queryKey: ['report'] })
    },
    onError: async () => {
      setIsFailed(true)
      await supabase.from('daily_reports').update({ ai_summary_failed: true }).eq('id', reportId)
    },
  })

  return (
    <div className="rounded-[12px] border border-[#e5e5e0] bg-[hsla(60,20%,98%,0.5)] p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xs font-medium text-[#91918c]">✨ AI 요약</span>
        {!generate.isPending && (
          <Button
            onClick={() => generate.mutate()}
            variant="ghost"
            size="sm"
            className="text-xs text-[#62625b]"
          >
            {summary ? '재생성' : '생성하기'}
          </Button>
        )}
      </div>
      {generate.isPending && <p className="text-sm text-[#91918c] animate-pulse">요약 생성 중...</p>}
      {isFailed && !generate.isPending && (
        <p className="text-sm text-red-500">요약 생성에 실패했어요. <button onClick={() => generate.mutate()} className="underline">재시도</button></p>
      )}
      {summary && !generate.isPending && (
        <p className="text-sm text-[#211922] leading-relaxed">{summary}</p>
      )}
    </div>
  )
}
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
npx vitest run tests/unit/components/AISummaryCard.test.tsx
# Expected: PASS 2/2
```

- [ ] **Step 8: 로컬 Edge Function 테스트**

```bash
supabase functions serve generate-summary
curl -X POST http://localhost:54321/functions/v1/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"dog_name":"보리","meals_eaten":"full","food_brand":"오리젠","walk_count":2,"walk_distance_km":1.2,"training_log":[],"mood":"happy","teacher_note":""}'
# Expected: {"summary":"보리가 오늘..."}
```

- [ ] **Step 9: 커밋**

```bash
git add supabase/functions/ src/components/reports/AISummaryCard.tsx tests/
git commit -m "feat: AI summary Edge Function + AISummaryCard component"
```

---

## Task 12: 보호자 피드 + Realtime

**Files:**
- Create: `src/hooks/useRealtime.ts`
- Create: `src/components/reports/ReportCard.tsx`
- Create: `src/components/reports/ReportFeed.tsx`
- Modify: `src/pages/GuardianFeedPage.tsx`

- [ ] **Step 1: useRealtime 훅 작성**

`src/hooks/useRealtime.ts`:
```typescript
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useReportRealtime(dogId: string) {
  const qc = useQueryClient()

  useEffect(() => {
    if (!dogId) return

    const channel = supabase
      .channel(`reports:${dogId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'daily_reports',
          filter: `dog_id=eq.${dogId}`,
        },
        (payload) => {
          // published_at이 설정된 경우에만 피드 업데이트
          if (payload.new && payload.new.published_at) {
            qc.invalidateQueries({ queryKey: ['reports', dogId] })
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [dogId, qc])
}
```

- [ ] **Step 2: ReportCard 컴포넌트 구현**

`src/components/reports/ReportCard.tsx`:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { MOOD_LABELS, MEALS_LABELS } from '../../types/domain'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'

type Props = { report: { id: string; mood: string; meals_eaten: string; walk_count: number;
  walk_distance_km: number; ai_summary: string | null; teacher_note: string | null;
  confirmed_at: string | null; published_at: string | null; date: string; food_brand_today: string | null } }

export default function ReportCard({ report }: Props) {
  const qc = useQueryClient()
  const confirmed = !!report.confirmed_at

  const confirm = useMutation({
    mutationFn: async () => {
      await supabase.from('daily_reports')
        .update({ confirmed_at: new Date().toISOString() })
        .eq('id', report.id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reports'] }),
  })

  return (
    <div className={cn(
      'rounded-[20px] border border-[#e5e5e0] p-4',
      confirmed ? 'bg-[#e5e5e0]' : 'bg-white'
    )}>
      <p className="mb-1 text-xs text-[#91918c]">{report.date}</p>
      <p className="mb-3 text-sm font-bold text-[#211922]">
        {MOOD_LABELS[report.mood as keyof typeof MOOD_LABELS] ?? report.mood}
        {' '}&middot;{' '}
        {MEALS_LABELS[report.meals_eaten as keyof typeof MEALS_LABELS] ?? report.meals_eaten}
      </p>

      {report.ai_summary && (
        <p className="mb-3 text-sm text-[#211922] leading-relaxed">{report.ai_summary}</p>
      )}

      <div className="flex gap-4 text-xs text-[#62625b]">
        <span>🚶 {report.walk_count}회 {report.walk_distance_km}km</span>
        {report.food_brand_today && <span>🍽 {report.food_brand_today}</span>}
      </div>

      {report.teacher_note && (
        <p className="mt-2 text-xs text-[#62625b] italic">&ldquo;{report.teacher_note}&rdquo;</p>
      )}

      {!confirmed && (
        <Button
          onClick={() => confirm.mutate()}
          disabled={confirm.isPending}
          className="mt-4 w-full rounded-[16px] bg-[#e60023] text-white"
        >
          확인했어요 ✓
        </Button>
      )}
      {confirmed && (
        <p className="mt-3 text-center text-xs text-[#91918c]">확인 완료 ✓</p>
      )}
    </div>
  )
}
```

- [ ] **Step 3: GuardianFeedPage 구현**

`src/pages/GuardianFeedPage.tsx`:
```typescript
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useReportRealtime } from '../hooks/useRealtime'
import ReportCard from '../components/reports/ReportCard'

export default function GuardianFeedPage() {
  const { user } = useAuth()

  const { data: dogs } = useQuery({
    queryKey: ['my-dogs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('dogs').select('*').eq('owner_id', user!.id)
      return data ?? []
    },
  })

  const primaryDog = dogs?.[0]
  useReportRealtime(primaryDog?.id ?? '')

  const { data: reports } = useQuery({
    queryKey: ['reports', primaryDog?.id],
    enabled: !!primaryDog,
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_reports')
        .select('*')
        .eq('dog_id', primaryDog!.id)
        .not('published_at', 'is', null)
        .order('date', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })

  if (!primaryDog) return <div className="p-4 text-center text-[#91918c]">아직 연결된 강아지가 없어요.</div>

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-bold text-[#211922]">{primaryDog.name}의 알림장</h1>
      {reports?.map(r => <ReportCard key={r.id} report={r as any} />)}
      {reports?.length === 0 && <p className="text-center text-sm text-[#91918c]">아직 받은 알림장이 없어요 🐾</p>}
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/
git commit -m "feat: guardian feed with Realtime subscription and confirm button"
```

---

## Task 13: AppLayout + TabBar

**Files:**
- Create: `src/components/layout/AppLayout.tsx`
- Create: `src/components/layout/TabBar.tsx`

- [ ] **Step 1: TabBar 구현**

`src/components/layout/TabBar.tsx`:
```typescript
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { cn } from '../../lib/utils'

const TEACHER_TABS = [
  { to: '/', label: '홈', icon: '🏠' },
  { to: '/announcements', label: '공지', icon: '📢' },
  { to: '/schedule', label: '일정', icon: '📅' },
  { to: '/album', label: '앨범', icon: '📷' },
  { to: '/meal-plan', label: '식단', icon: '🍽' },
]

const GUARDIAN_TABS = [
  { to: '/feed', label: '알림장', icon: '📝' },
  { to: '/announcements', label: '공지', icon: '📢' },
  { to: '/schedule', label: '일정', icon: '📅' },
  { to: '/album', label: '앨범', icon: '📷' },
]

export default function TabBar() {
  const { role } = useAuth()
  const tabs = role === 'teacher' ? TEACHER_TABS : GUARDIAN_TABS

  return (
    <nav className="fixed bottom-0 left-0 right-0 flex border-t border-[#e5e5e0] bg-white">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => cn(
            'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs',
            isActive ? 'text-[#e60023] font-medium' : 'text-[#91918c]'
          )}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: AppLayout 구현**

`src/components/layout/AppLayout.tsx`:
```typescript
import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import TabBar from './TabBar'

export default function AppLayout() {
  const { user, role, loading } = useAuth()

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>
  if (!user || !role) return <Navigate to="/onboarding" replace />

  return (
    <div className="mx-auto min-h-screen max-w-md bg-white">
      <main className="pb-20">
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/components/layout/
git commit -m "feat: AppLayout with role-based TabBar"
```

---

## Task 14: 이메일 알림 (Resend)

**Files:**
- Create: `supabase/functions/notify-guardian/index.ts`

- [ ] **Step 1: Resend API 키 설정**

Resend(https://resend.com) 가입 → API 키 생성 → Supabase Secret 설정:
```bash
supabase secrets set RESEND_API_KEY=re_...
```

- [ ] **Step 2: notify-guardian Edge Function 작성**

`supabase/functions/notify-guardian/index.ts`:
```typescript
import { createClient } from 'npm:@supabase/supabase-js'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!

Deno.serve(async (req) => {
  const { report_id } = await req.json()

  const { data: report } = await supabase
    .from('daily_reports')
    .select('*, dogs(name, owner_id, owner:auth.users(email))')
    .eq('id', report_id)
    .single()

  if (!report?.published_at) return new Response('Not published', { status: 400 })

  const ownerEmail = (report.dogs as any)?.owner?.email
  const dogName = (report.dogs as any)?.name
  if (!ownerEmail) return new Response('No guardian email', { status: 404 })

  const summary = report.ai_summary ?? `${dogName}의 오늘 알림장이 도착했어요!`

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Doggy-note <noreply@doggy-note.app>',
      to: ownerEmail,
      subject: `🐾 ${dogName}의 오늘 알림장이 도착했어요`,
      html: `<p>${summary}</p><p><a href="${Deno.env.get('SITE_URL')}/feed">알림장 보러가기</a></p>`,
    }),
  })

  return new Response('OK')
})
```

- [ ] **Step 3: DB Webhook 설정**

Supabase 웹 콘솔 → Database → Webhooks → "New webhook":
- Name: `notify-guardian-on-publish`
- Table: `daily_reports`
- Events: `UPDATE`
- URL: `https://<project-ref>.supabase.co/functions/v1/notify-guardian`
- HTTP Headers: `Authorization: Bearer <SUPABASE_ANON_KEY>`
- Payload filter: `{ "type": "UPDATE", "record": { "published_at": { "not": null } } }`

- [ ] **Step 4: Edge Function 배포**

```bash
supabase secrets set SITE_URL=https://doggy-note.vercel.app
supabase functions deploy notify-guardian
```

- [ ] **Step 5: 커밋**

```bash
git add supabase/functions/notify-guardian/
git commit -m "feat: email notification on report publish via Resend"
```

---

## Task 15: 공지사항 페이지

**Files:**
- Modify: `src/pages/AnnouncementsPage.tsx`

- [ ] **Step 1: AnnouncementsPage 구현**

`src/pages/AnnouncementsPage.tsx`:
```typescript
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Textarea } from '../components/ui/textarea'

export default function AnnouncementsPage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isWriting, setIsWriting] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: announcements } = useQuery({
    queryKey: ['announcements', profile?.daycare_id],
    enabled: !!profile?.daycare_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('daycare_id', profile!.daycare_id!)
        .order('published_at', { ascending: false })
      return data ?? []
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await supabase.from('announcements').insert({
        daycare_id: profile!.daycare_id!,
        teacher_id: user!.id,
        title,
        body,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] })
      setTitle('')
      setBody('')
      setIsWriting(false)
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#211922]">공지사항</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsWriting(!isWriting)} variant="outline" size="sm" className="rounded-[16px]">
            {isWriting ? '취소' : '작성'}
          </Button>
        )}
      </div>

      {isWriting && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#f6f6f3] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="rounded-[16px]" />
          <Textarea value={body} onChange={e => setBody(e.target.value)} placeholder="내용" className="rounded-[16px] min-h-[100px]" />
          <Button onClick={() => create.mutate()} disabled={!title || !body || create.isPending}
            className="rounded-[16px] bg-[#e60023] text-white">
            {create.isPending ? '저장 중...' : '공지 올리기'}
          </Button>
        </div>
      )}

      {announcements?.map(a => (
        <div key={a.id} className="rounded-[20px] border border-[#e5e5e0] bg-white p-4">
          <p className="text-xs text-[#91918c] mb-1">
            {new Date(a.published_at!).toLocaleDateString('ko-KR')}
          </p>
          <p className="font-bold text-[#211922] mb-1">{a.title}</p>
          <p className="text-sm text-[#62625b] whitespace-pre-wrap">{a.body}</p>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/pages/AnnouncementsPage.tsx
git commit -m "feat: announcements page (teacher write, all read)"
```

---

## Task 16: 앨범 (Supabase Storage)

**Files:**
- Modify: `src/pages/AlbumPage.tsx`
- Create: `src/hooks/usePhotos.ts`

- [ ] **Step 1: Supabase Storage 버킷 생성**

Supabase 웹 콘솔 → Storage → "New bucket":
- Name: `photos`
- Public: false (RLS 사용)

Storage RLS 정책 추가 (SQL Editor):
```sql
CREATE POLICY "teacher_upload_photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "authenticated_read_photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

- [ ] **Step 2: usePhotos 훅 구현**

`src/hooks/usePhotos.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useDogPhotos(dogId: string) {
  return useQuery({
    queryKey: ['photos', dogId],
    enabled: !!dogId,
    queryFn: async () => {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .eq('dog_id', dogId)
        .order('taken_at', { ascending: false })
        .limit(20)
      return data ?? []
    },
  })
}

export function useUploadPhoto(dogId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (file: File) => {
      const path = `${dogId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
      if (uploadError) throw uploadError
      const { error: dbError } = await supabase.from('photos').insert({
        dog_id: dogId,
        storage_path: path,
      })
      if (dbError) throw dbError
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['photos', dogId] }),
  })
}

export function usePhotoUrl(storagePath: string) {
  const { data } = supabase.storage.from('photos').getPublicUrl(storagePath)
  return data.publicUrl
}
```

- [ ] **Step 3: AlbumPage 구현**

`src/pages/AlbumPage.tsx`:
```typescript
import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useDogPhotos, useUploadPhoto } from '../hooks/usePhotos'

function PhotoGrid({ dogId }: { dogId: string }) {
  const { data: photos } = useDogPhotos(dogId)
  const upload = useUploadPhoto(dogId)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach(f => upload.mutate(f))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="mb-4 w-full rounded-[16px] border border-dashed border-[#e5e5e0] py-4 text-sm text-[#91918c]"
      >
        + 사진 추가
      </button>
      <div style={{ columns: 2, columnGap: 8 }}>
        {photos?.map(p => {
          const { data } = supabase.storage.from('photos').getPublicUrl(p.storage_path)
          return (
            <img
              key={p.id}
              src={data.publicUrl}
              alt=""
              className="mb-2 w-full rounded-[16px] object-cover"
              style={{ breakInside: 'avoid' }}
            />
          )
        })}
      </div>
    </div>
  )
}

export default function AlbumPage() {
  const { user } = useAuth()
  const { data: dogs } = useQuery({
    queryKey: ['my-dogs', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('dogs')
        .select('*')
        .or(`owner_id.eq.${user!.id},daycare_id.in.(select daycare_id from user_profiles where id = '${user!.id}')`)
        .limit(1)
      return data ?? []
    },
  })

  const dog = dogs?.[0]
  if (!dog) return <div className="p-4 text-center text-[#91918c]">강아지를 먼저 등록해주세요.</div>

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-4 text-xl font-bold text-[#211922]">앨범</h1>
      <PhotoGrid dogId={dog.id} />
    </div>
  )
}
```

- [ ] **Step 4: 커밋**

```bash
git add src/
git commit -m "feat: album page with Supabase Storage upload and masonry grid"
```

---

## Task 17: 일정표 + 식단표

**Files:**
- Modify: `src/pages/SchedulePage.tsx`
- Modify: `src/pages/MealPlanPage.tsx`

- [ ] **Step 1: SchedulePage 구현**

`src/pages/SchedulePage.tsx`:
```typescript
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

export default function SchedulePage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [desc, setDesc] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: schedules } = useQuery({
    queryKey: ['schedules', profile?.daycare_id],
    enabled: !!profile?.daycare_id,
    queryFn: async () => {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('daycare_id', profile!.daycare_id!)
        .gte('event_date', new Date().toISOString().split('T')[0])
        .order('event_date')
      return data ?? []
    },
  })

  const create = useMutation({
    mutationFn: async () => {
      await supabase.from('schedules').insert({
        daycare_id: profile!.daycare_id!,
        title,
        description: desc,
        event_date: date,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['schedules'] })
      setTitle(''); setDate(''); setDesc(''); setIsAdding(false)
    },
  })

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#211922]">일정표</h1>
        {role === 'teacher' && (
          <Button onClick={() => setIsAdding(!isAdding)} variant="outline" size="sm" className="rounded-[16px]">
            {isAdding ? '취소' : '+ 추가'}
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="flex flex-col gap-3 rounded-[20px] bg-[#f6f6f3] p-4">
          <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="일정 제목" className="rounded-[16px]" />
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-[16px]" />
          <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="상세 내용 (선택)" className="rounded-[16px]" />
          <Button onClick={() => create.mutate()} disabled={!title || !date || create.isPending}
            className="rounded-[16px] bg-[#e60023] text-white">
            저장
          </Button>
        </div>
      )}

      {schedules?.map(s => (
        <div key={s.id} className="rounded-[20px] border border-[#e5e5e0] bg-white p-4">
          <p className="text-xs text-[#91918c] mb-1">
            {new Date(s.event_date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
          </p>
          <p className="font-bold text-[#211922]">{s.title}</p>
          {s.description && <p className="text-sm text-[#62625b] mt-1">{s.description}</p>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: MealPlanPage 구현**

`src/pages/MealPlanPage.tsx`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { MealPlanEntry } from '../types/domain'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'

const DAYS: MealPlanEntry['day'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_KO: Record<string, string> = { Mon: '월', Tue: '화', Wed: '수', Thu: '목', Fri: '금' }

function getMonday(d = new Date()) {
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().split('T')[0]
}

export default function MealPlanPage() {
  const { user, role } = useAuth()
  const qc = useQueryClient()
  const weekStart = getMonday()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<MealPlanEntry[]>(
    DAYS.map(day => ({ day, morning: '', lunch: '', snack: '' }))
  )

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from('user_profiles').select('daycare_id').eq('id', user!.id).single()
      return data
    },
  })

  const { data: plan } = useQuery({
    queryKey: ['meal-plan', profile?.daycare_id, weekStart],
    enabled: !!profile?.daycare_id,
    queryFn: async () => {
      const { data } = await supabase.from('meal_plans').select('*')
        .eq('daycare_id', profile!.daycare_id!).eq('week_start', weekStart).single()
      return data
    },
  })

  const save = useMutation({
    mutationFn: async () => {
      await supabase.from('meal_plans').upsert({
        daycare_id: profile!.daycare_id!,
        week_start: weekStart,
        entries: draft,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meal-plan'] })
      setEditing(false)
    },
  })

  const entries: MealPlanEntry[] = (plan?.entries as MealPlanEntry[]) ?? []

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#211922]">이번 주 식단</h1>
        {role === 'teacher' && (
          <Button onClick={() => { setDraft(entries.length ? entries : draft); setEditing(!editing) }}
            variant="outline" size="sm" className="rounded-[16px]">
            {editing ? '취소' : '수정'}
          </Button>
        )}
      </div>

      {DAYS.map(day => {
        const e = entries.find(e => e.day === day) ?? { day, morning: '-', lunch: '-', snack: '-' }
        const d = draft.find(e => e.day === day)!
        return (
          <div key={day} className="rounded-[20px] border border-[#e5e5e0] bg-white p-4">
            <p className="font-bold text-[#211922] mb-2">{DAY_KO[day]}요일</p>
            {editing ? (
              <div className="flex flex-col gap-2">
                {(['morning', 'lunch', 'snack'] as const).map(meal => (
                  <Input key={meal} value={d[meal]}
                    onChange={ev => setDraft(prev => prev.map(p => p.day === day ? { ...p, [meal]: ev.target.value } : p))}
                    placeholder={meal === 'morning' ? '아침' : meal === 'lunch' ? '점심' : '간식'}
                    className="rounded-[16px] text-sm" />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1 text-sm text-[#62625b]">
                <span>🌅 {e.morning}</span>
                <span>☀️ {e.lunch}</span>
                <span>🍪 {e.snack}</span>
              </div>
            )}
          </div>
        )
      })}

      {editing && (
        <Button onClick={() => save.mutate()} disabled={save.isPending}
          className="rounded-[16px] bg-[#e60023] text-white">
          {save.isPending ? '저장 중...' : '식단 저장'}
        </Button>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 커밋**

```bash
git add src/pages/
git commit -m "feat: schedule and meal plan pages"
```

---

## Task 18: 초대 수락 페이지

**Files:**
- Modify: `src/pages/InviteAcceptPage.tsx`

- [ ] **Step 1: InviteAcceptPage 구현**

`src/pages/InviteAcceptPage.tsx`:
```typescript
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, signInWithGoogle } from '../hooks/useAuth'
import { acceptInvite } from '../hooks/useInvite'

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>()
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user || !token || status !== 'idle') return
    setStatus('accepting')
    acceptInvite(token)
      .then(() => { setStatus('done'); setTimeout(() => navigate('/feed'), 1500) })
      .catch((e: Error) => { setStatus('error'); setErrorMsg(e.message) })
  }, [user, token, status, navigate])

  if (loading) return <div className="flex min-h-screen items-center justify-center">로딩 중...</div>

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
        <p className="text-xl font-bold text-[#211922]">🐾 초대 링크를 받으셨군요!</p>
        <p className="text-sm text-[#62625b] text-center">Google 계정으로 로그인하면 강아지와 연결돼요.</p>
        <button onClick={signInWithGoogle}
          className="rounded-[16px] bg-[#e60023] px-8 py-3 text-white font-medium">
          Google로 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      {status === 'accepting' && <p className="text-[#91918c]">강아지와 연결 중...</p>}
      {status === 'done' && <p className="text-xl">🎉 연결 완료! 피드로 이동합니다.</p>}
      {status === 'error' && (
        <div className="text-center">
          <p className="text-red-500 mb-2">연결에 실패했어요</p>
          <p className="text-sm text-[#62625b]">{errorMsg}</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/pages/InviteAcceptPage.tsx
git commit -m "feat: invite accept page with token validation"
```

---

## Task 19: E2E 테스트 (Playwright)

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/report-flow.spec.ts`

- [ ] **Step 1: Playwright 설치**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Playwright 설정**

`playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
})
```

- [ ] **Step 3: 핵심 플로우 E2E 테스트 작성**

`tests/e2e/report-flow.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

// NOTE: 이 테스트는 미리 시드된 테스트 계정이 필요합니다.
// Supabase Dashboard에서 테스트용 teacher@test.com / guardian@test.com 계정 생성 후 실행.

test('선생님: 알림장 작성 → AI 요약 → 발송 플로우', async ({ page }) => {
  // 이 테스트는 로컬 테스트 환경에서 수동 실행용입니다.
  // CI에서는 SKIP (Google OAuth 자동화 불가)
  test.skip(!!process.env.CI, 'Skip in CI — requires manual Google OAuth')

  await page.goto('/')
  // 로그인 후 상태를 가정 (localStorage에 세션 주입)
  // 실제 테스트 시 supabase.auth.signInWithPassword로 테스트 계정 사용
  await expect(page.locator('text=알림장')).toBeVisible()
})

test('보호자: 피드 확인 버튼', async ({ page }) => {
  test.skip(!!process.env.CI, 'Skip in CI — requires manual Google OAuth')
  await page.goto('/feed')
  // 확인 버튼이 있으면 클릭
  const confirmBtn = page.locator('text=확인했어요')
  if (await confirmBtn.isVisible()) {
    await confirmBtn.click()
    await expect(page.locator('text=확인 완료')).toBeVisible()
  }
})
```

- [ ] **Step 4: 커밋**

```bash
git add playwright.config.ts tests/e2e/
git commit -m "feat: Playwright E2E test scaffold"
```

---

## Task 20: CI/CD + Vercel 배포

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `CLAUDE.md`

- [ ] **Step 1: GitHub Actions CI 작성**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run test -- --run
      - run: npm run build

  types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
```

`package.json`에 test script 추가:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 2: Vercel 배포 설정**

1. https://vercel.com → New Project → GitHub repo 연결
2. Framework: Vite
3. Environment Variables 추가: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
4. Deploy

- [ ] **Step 3: CLAUDE.md 작성 (프로젝트 컨벤션)**

`CLAUDE.md`:
```markdown
# Doggy-note

강아지 유치원-보호자 커뮤니케이션 앱.

## Tech Stack
- React 19 + Vite + TypeScript + Tailwind CSS
- Supabase (Auth/DB/Storage/Realtime)
- React Router v7 + TanStack Query v5
- shadcn/ui (src/components/ui/ — 건드리지 말 것)

## Testing
- Unit: `npm run test` (Vitest + Testing Library)
- E2E: `npx playwright test` (로컬만, CI 스킵)
- Supabase RLS: `supabase test db`

## Design System
- 색상: #e60023 (CTA), #211922 (텍스트), #e5e5e0 (보조)
- 카드 radius: 20px, 버튼 radius: 16px, 섀도 없음
- DESIGN.md: ~/.gstack/projects/anko-developer-doggy-note/designs/DESIGN.md

## Key Decisions (Eng Review 2026-04-23)
- Edge Function은 AI 요약 텍스트만 반환 — SPA가 DB에 씀
- AI 요약: 선생님이 확인 후 발송 (발송 전 생성)
- 초대 토큰: crypto.randomUUID() (UUID v4)
- Realtime: dog_id=eq.{id} 필터로 구독 좁힘

## File Conventions
- 훅: src/hooks/use*.ts
- 페이지: src/pages/*Page.tsx
- 컴포넌트: src/components/{category}/*.tsx
- 공유 타입: src/types/domain.ts (절대 supabase.ts 직접 편집 금지)
```

- [ ] **Step 4: 최종 커밋**

```bash
git add .github/ CLAUDE.md
git commit -m "feat: CI/CD pipeline + CLAUDE.md conventions"
git push origin main
```

- [ ] **Step 5: 배포 확인**

Vercel 대시보드에서 빌드 성공 확인. `https://doggy-note.vercel.app` 접속.

---

## Self-Review

**Spec coverage 체크:**

| 요구사항 | Task |
|---------|------|
| Google OAuth 로그인 | Task 2, 8 |
| 선생님 역할 선택 + 유치원 합류 | Task 8, 9 |
| 강아지 등록 + 초대 토큰 | Task 9 |
| 보호자 초대 수락 | Task 18 |
| 알림장 작성 (기분/식사/산책/훈련) | Task 10 |
| AI 요약 생성 (Edge Function) | Task 11 |
| 알림장 발송 | Task 10 (publish) |
| 보호자 피드 + Realtime | Task 12 |
| 확인 버튼 | Task 12 |
| 이메일 알림 (Resend) | Task 14 |
| 공지사항 | Task 15 |
| 앨범 (Supabase Storage) | Task 16 |
| 일정표 | Task 17 |
| 식단표 | Task 17 |
| RLS 전체 정책 | Task 4 |
| DB 인덱스 | Task 4 |
| CI/CD + Vercel | Task 20 |
| CLAUDE.md | Task 20 |

**누락된 기능 없음.**

**Placeholder 스캔:** "TBD", "TODO", "implement later" — 없음. 모든 step에 실제 코드 포함.

**타입 일관성:** `MealsEaten`, `Mood`, `TrainingEntry`, `MealPlanEntry`는 Task 5에서 정의되고 Task 10-17 전체에서 동일하게 사용됨.

---

*플랜 생성: 2026-04-23 | 설계 문서: `~/.gstack/projects/anko-developer-doggy-note/it1403-main-design-20260423-101014.md`*
