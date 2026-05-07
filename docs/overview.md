# Doggy-note 개요

강아지 유치원과 보호자를 연결하는 알림장 플랫폼. 선생님이 강아지의 하루 기록을 작성하면 AI가 요약하여 보호자에게 발송한다.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4 |
| 라우팅 | React Router v7 |
| 서버 상태 | TanStack React Query v5 |
| UI 컴포넌트 | @base-ui/react + 커스텀 shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) |
| AI 요약 | OpenAI GPT-4o-mini |
| 이메일 | Resend |

## 역할 구분

### 선생님 (teacher)
- 강아지 등록 및 일일 알림장 작성
- AI 요약 생성 및 보호자에게 발송
- 공지사항·일정·식단·앨범 관리
- 보호자 초대 링크 생성

### 보호자 (guardian)
- 알림장 수신 및 확인
- 공지사항·일정·앨범 조회 (읽기 전용)
- 초대 링크를 통해 강아지와 연결

## 라우팅 구조

```
/                       TeacherHomePage     선생님 전용
/report/:dogId/write    ReportWritePage     선생님 전용
/feed                   GuardianFeedPage    보호자 전용
/announcements          AnnouncementsPage   공통
/schedule               SchedulePage        공통
/album                  AlbumPage           공통
/meal-plan              MealPlanPage        선생님 전용
/onboarding             OnboardingPage      미인증 사용자
/onboarding/join-daycare JoinDaycarePage   선생님 최초 설정
/invite/:token          InviteAcceptPage    보호자 초대 수락
/auth/callback          AuthCallbackPage    Google OAuth 콜백
```

## 애플리케이션 레이아웃

인증된 사용자는 `AppLayout`으로 감싸지며 상단 헤더(로그아웃)와 하단 `TabBar`가 표시된다.

```
┌──────────────────────────┐
│ Header (로그아웃)         │
├──────────────────────────┤
│                          │
│   <Page />               │
│                          │
├──────────────────────────┤
│ TabBar (하단 네비게이션) │
└──────────────────────────┘
```

TabBar는 역할에 따라 탭이 달라진다.

- **선생님:** 홈 / 공지 / 일정 / 앨범 / 식단
- **보호자:** 알림장 / 공지 / 일정 / 앨범
