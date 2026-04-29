-- INSERT 정책은 daycare 기반인데 SELECT 정책은 membership 기반으로 남아있어
-- SELECT가 null을 반환하고 저장 시마다 INSERT → UNIQUE 충돌 발생.
-- INSERT 정책과 동일한 daycare 기반으로 통일.
DROP POLICY IF EXISTS "teacher_read_own_reports" ON daily_reports;
CREATE POLICY "teacher_read_own_reports" ON daily_reports FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM dogs d
    JOIN user_profiles up ON up.daycare_id = d.daycare_id
    WHERE d.id = daily_reports.dog_id
      AND up.id = auth.uid()
      AND up.role = 'teacher'
  )
);
