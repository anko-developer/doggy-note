CREATE INDEX idx_dogs_owner_id ON dogs(owner_id);
CREATE INDEX idx_memberships_teacher_id ON memberships(teacher_id);
CREATE INDEX idx_photos_dog_taken ON photos(dog_id, taken_at DESC);
CREATE INDEX idx_announcements_daycare_published ON announcements(daycare_id, published_at DESC);
CREATE INDEX idx_schedules_daycare_date ON schedules(daycare_id, event_date);
-- daily_reports(dog_id, date)는 UNIQUE 제약으로 인덱스 이미 존재
