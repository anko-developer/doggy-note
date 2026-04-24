import { createBrowserRouter } from 'react-router-dom'
import OnboardingPage from '@/pages/OnboardingPage'
import TeacherHomePage from '@/pages/TeacherHomePage'
import ReportWritePage from '@/pages/ReportWritePage'
import GuardianFeedPage from '@/pages/GuardianFeedPage'
import AlbumPage from '@/pages/AlbumPage'
import AnnouncementsPage from '@/pages/AnnouncementsPage'
import SchedulePage from '@/pages/SchedulePage'
import MealPlanPage from '@/pages/MealPlanPage'
import InviteAcceptPage from '@/pages/InviteAcceptPage'
import AppLayout from '@/components/layout/AppLayout'
import AuthCallbackPage from '@/pages/AuthCallbackPage'

export const router = createBrowserRouter([
  { path: '/invite/:token', element: <InviteAcceptPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
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
