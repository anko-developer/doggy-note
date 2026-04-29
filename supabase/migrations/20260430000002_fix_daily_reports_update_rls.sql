-- INSERT·SELECT는 daycare 기반인데 UPDATE만 membership 기반으로 남아
-- UPDATE가 RLS에 막혀 0 rows → .single() → 406 발생.
-- 세 정책을 daycare 기반으로 통일.
DROP POLICY IF EXISTS "teacher_update_own_reports" ON daily_reports;
CREATE POLICY "teacher_update_own_reports" ON daily_reports FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM dogs d
    JOIN user_profiles up ON up.daycare_id = d.daycare_id
    WHERE d.id = daily_reports.dog_id
      AND up.id = auth.uid()
      AND up.role = 'teacher'
  )
);
