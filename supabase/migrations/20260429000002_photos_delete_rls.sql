-- photos DELETE: 같은 유치원 소속 선생님이 삭제 가능
CREATE POLICY "teacher_delete_photos" ON photos FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM dogs d
    JOIN user_profiles up ON up.daycare_id = d.daycare_id
    WHERE d.id = photos.dog_id
      AND up.id = auth.uid()
      AND up.role = 'teacher'
  )
);
