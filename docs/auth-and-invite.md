# 인증 및 초대 흐름

## 인증 방식

Google OAuth를 사용한다. Supabase Auth가 OAuth flow를 처리하고 세션을 localStorage에 저장한다.

## 로그인 흐름

```
1. OnboardingPage → "Google로 시작하기" 클릭
2. supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: '/auth/callback' })
3. Google 인증 완료 → /auth/callback 리다이렉트
4. AuthCallbackPage: onAuthStateChange 이벤트 수신
5. /onboarding 으로 이동
6. 역할 선택에 따라 분기
```

## 역할 초기 설정

### 선생님

```
RoleSelect → user_profiles.role = 'teacher' 저장
→ JoinDaycarePage

  선택 A: 새 유치원 생성
    - 유치원 이름 입력
    - 6자리 join_code 자동 생성 (Math.random)
    - daycares 테이블 INSERT
    - user_profiles.daycare_id 업데이트
    → TeacherHomePage (/)

  선택 B: 기존 유치원 합류
    - 원장이 제공한 6자리 코드 입력
    - daycares 테이블에서 join_code로 검색
    - user_profiles.daycare_id 업데이트
    → TeacherHomePage (/)
```

### 보호자

```
RoleSelect → user_profiles.role = 'guardian' 저장
→ GuardianFeedPage (/feed)
   (강아지 연결 전까지 "아직 연결된 강아지가 없어요" 표시)
```

## 보호자 초대 흐름

### 1단계: 선생님이 초대 링크 생성

```
TeacherHomePage → 강아지 카드의 "보호자 초대 링크 복사" 클릭

createInvite(dogId, daycareId):
  token = crypto.randomUUID()
  invites 테이블 INSERT { token, dog_id, daycare_id }
  링크: https://앱주소/invite/{token}
  클립보드에 복사 → "초대 링크 복사 완료" Dialog 표시
```

### 2단계: 보호자가 링크 접속

```
/invite/:token 접속

경우 A: 이미 로그인된 상태
  → acceptInvite(token) RPC 호출
  → DB: UPDATE dogs SET owner_id = user.id WHERE id = dog_id
  → DB: DELETE FROM invites WHERE token = token (1회용 삭제)
  → 보호자 프로필 없으면 user_profiles INSERT { role: 'guardian' }
  → /feed 로 이동

경우 B: 미로그인 상태
  → localStorage에 pendingInviteToken 저장
  → Google 로그인 진행
  → 로그인 완료 후 OnboardingPage에서 pendingInviteToken 감지
  → /invite/{token} 으로 리다이렉트
  → 경우 A와 동일하게 처리
```

## 전역 인증 상태 관리

`useAuth()` 훅이 앱 전체의 인증 상태를 관리한다.

```typescript
const { user, role, daycareId, loading } = useAuth()
```

- `supabase.auth.onAuthStateChange` 리스너로 세션 변경 감지
- 세션 변경 시 `user_profiles` 테이블에서 role, daycare_id 조회
- AppLayout에서 역할·daycare_id 여부에 따라 자동 리다이렉트

## 접근 제어

| 조건 | 리다이렉트 |
|------|-----------|
| 미인증 | /onboarding |
| 인증됨 + 역할 없음 | /onboarding |
| 선생님 + daycare_id 없음 | /onboarding/join-daycare |
| 보호자가 / 접근 | /feed |
