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
