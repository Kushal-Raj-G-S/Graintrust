-- ============================================
-- EDUCATION MODULE - DATABASE SCHEMA
-- Tracks user learning progress, courses, achievements
-- ============================================

-- Create user_education_profile table
CREATE TABLE IF NOT EXISTS "user_education_profile" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "level" INTEGER NOT NULL DEFAULT 1,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "lastVisitDate" DATE,
    "totalStudyHours" INTEGER NOT NULL DEFAULT 0,
    "certificates" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId")
);

-- Create courses_completed table
CREATE TABLE IF NOT EXISTS "courses_completed" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER NOT NULL DEFAULT 100,
    "rating" INTEGER CHECK ("rating" BETWEEN 1 AND 5),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS "user_achievements" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "achievementId" TEXT NOT NULL,
    "achievementName" TEXT NOT NULL,
    "achievementType" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create learning_calendar table (tracks daily visits)
CREATE TABLE IF NOT EXISTS "learning_calendar" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "visitDate" DATE NOT NULL,
    "lessonsCompleted" INTEGER NOT NULL DEFAULT 0,
    "studyMinutes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE("userId", "visitDate")
);

-- Create course_enrollments table
CREATE TABLE IF NOT EXISTS "course_enrollments" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "courseId" TEXT NOT NULL,
    "courseName" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'active' CHECK ("status" IN ('active', 'completed', 'paused')),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_study_sessions table
CREATE TABLE IF NOT EXISTS "user_study_sessions" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "subject" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "user_education_profile_userId_idx" ON "user_education_profile"("userId");
CREATE INDEX IF NOT EXISTS "courses_completed_userId_idx" ON "courses_completed"("userId");
CREATE INDEX IF NOT EXISTS "user_achievements_userId_idx" ON "user_achievements"("userId");
CREATE INDEX IF NOT EXISTS "learning_calendar_userId_idx" ON "learning_calendar"("userId");
CREATE INDEX IF NOT EXISTS "learning_calendar_visitDate_idx" ON "learning_calendar"("visitDate");
CREATE INDEX IF NOT EXISTS "course_enrollments_userId_idx" ON "course_enrollments"("userId");
CREATE INDEX IF NOT EXISTS "user_study_sessions_userId_idx" ON "user_study_sessions"("userId");

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_user_education_profile_updated_at
    BEFORE UPDATE ON "user_education_profile"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_enrollments_updated_at
    BEFORE UPDATE ON "course_enrollments"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION calculate_next_level_xp(current_level INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (current_level * 300) + 200;
END;
$$ LANGUAGE plpgsql;

-- Function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak(p_userId TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_lastVisit DATE;
    v_today DATE := CURRENT_DATE;
    v_streak INTEGER;
BEGIN
    SELECT "lastVisitDate", "streak" 
    INTO v_lastVisit, v_streak
    FROM "user_education_profile"
    WHERE "userId" = p_userId;
    
    IF v_lastVisit IS NULL THEN
        -- First visit
        v_streak := 1;
    ELSIF v_lastVisit = v_today THEN
        -- Already visited today, keep current streak
        RETURN v_streak;
    ELSIF v_lastVisit = v_today - INTERVAL '1 day' THEN
        -- Consecutive day, increment streak
        v_streak := v_streak + 1;
    ELSE
        -- Streak broken, reset to 1
        v_streak := 1;
    END IF;
    
    UPDATE "user_education_profile"
    SET "streak" = v_streak,
        "lastVisitDate" = v_today
    WHERE "userId" = p_userId;
    
    RETURN v_streak;
END;
$$ LANGUAGE plpgsql;

-- Verify setup
SELECT 'SUCCESS! Education tables created in Supabase!' as status;
