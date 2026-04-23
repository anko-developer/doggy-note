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
