-- 코드로 유치원 합류 시 join_code로 daycare를 조회할 수 있어야 함.
-- 기존 정책은 daycare_id가 이미 설정된 유저만 읽을 수 있어서
-- 신규 선생님이 join_code로 daycare를 찾지 못하는 버그 수정.
CREATE POLICY "authenticated_read_daycare_for_join" ON daycares
  FOR SELECT TO authenticated USING (true);
