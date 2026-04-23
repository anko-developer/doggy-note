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
