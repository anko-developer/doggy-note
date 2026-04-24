# Doggy-note

강아지 유치원-보호자 커뮤니케이션 앱.

## Tech Stack
- React 19 + Vite + TypeScript + Tailwind CSS v4
- Supabase (Auth/DB/Storage/Realtime)
- React Router v7 + TanStack Query v5
- shadcn/ui (src/components/ui/ — 건드리지 말 것)

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Test (watch): `npm test`
- Test (run once): `npm run test:run`
- Type check: `npx tsc --noEmit`

## Testing
- Unit: Vitest + Testing Library (`tests/unit/`)
- E2E: `npx playwright test` (로컬만, CI 스킵)
- Supabase RLS: `supabase test db`

## Design System
- 색상: #e60023 (CTA), #211922 (텍스트), #e5e5e0 (보조 버튼/경계선)
- 카드 radius: 20px, 버튼 radius: 16px, 섀도 없음
- 설계 문서: ~/.gstack/projects/anko-developer-doggy-note/designs/DESIGN.md

## Key Architecture Decisions
- Edge Function은 AI 요약 텍스트만 반환 — SPA가 daily_reports.ai_summary에 직접 씀
- AI 요약: 선생님이 확인 후 "알림장 보내기" 클릭 (발송 전 생성)
- 초대 토큰: crypto.randomUUID() (UUID v4, 브루트포스 방지)
- Realtime: dog_id=eq.{id} 필터로 구독 범위 좁힘

## File Conventions
- 훅: src/hooks/use*.ts
- 페이지: src/pages/*Page.tsx
- 컴포넌트: src/components/{category}/*.tsx
- 공유 타입: src/types/domain.ts
- supabase.ts: 자동 생성 — 직접 편집 금지

## Supabase
- DB 타입 재생성: `supabase gen types typescript --project-id <ID> > src/types/supabase.ts`
- Edge Functions 배포: `supabase functions deploy <name>`
- Secrets: `supabase secrets set KEY=value`

## Deployment
- Frontend: Vercel (connect GitHub repo, Framework: Vite)
- Edge Functions: Supabase (deploy via CLI)
- Required env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
