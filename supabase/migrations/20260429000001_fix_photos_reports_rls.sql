-- photos: membership 기반 → daycare 기반으로 변경
-- 같은 유치원 소속 선생님이면 모든 강아지 사진을 추가할 수 있어야 함
DROP POLICY IF EXISTS "teacher_insert_photos" ON photos;
CREATE POLICY "teacher_insert_photos" ON photos FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM dogs d
    JOIN user_profiles up ON up.daycare_id = d.daycare_id
    WHERE d.id = photos.dog_id
      AND up.id = auth.uid()
      AND up.role = 'teacher'
  )
);

-- daily_reports: membership 기반 → daycare 기반으로 변경
-- 같은 유치원 소속 선생님이면 모든 강아지 알림장을 작성할 수 있어야 함
DROP POLICY IF EXISTS "teacher_insert_reports" ON daily_reports;
CREATE POLICY "teacher_insert_reports" ON daily_reports FOR INSERT WITH CHECK (
  teacher_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM dogs d
    JOIN user_profiles up ON up.daycare_id = d.daycare_id
    WHERE d.id = daily_reports.dog_id
      AND up.id = auth.uid()
      AND up.role = 'teacher'
  )
);
