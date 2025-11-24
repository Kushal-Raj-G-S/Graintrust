-- ============================================
-- PERFORMANCE OPTIMIZATION: DATABASE INDEXES
-- Run this in Supabase SQL Editor for FASTER queries
-- ============================================

-- 1. Notifications table indexes
-- Speed up fetching notifications by user
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created 
ON notifications("userId", "createdAt" DESC);

-- Speed up unread notifications queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read 
ON notifications("userId", "read");

-- Speed up notification type filtering
CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON notifications("type", "createdAt" DESC);

-- 2. Batches table indexes
-- Speed up farmer's batches
CREATE INDEX IF NOT EXISTS idx_batches_farmer_created 
ON batches("farmerId", "createdAt" DESC);

-- Speed up verification status queries
CREATE INDEX IF NOT EXISTS idx_batches_verification_status 
ON batches("verificationStatus", "createdAt" DESC);

-- Speed up batch code lookups
CREATE INDEX IF NOT EXISTS idx_batches_batch_code 
ON batches("batchCode");

-- 3. Users table indexes
-- Speed up role-based queries (e.g., finding all farmers/admins)
CREATE INDEX IF NOT EXISTS idx_users_role_name 
ON users("role", "name");

-- Speed up email lookups for auth
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users("email");

-- 4. Image verifications table indexes
-- Speed up finding verifications by stage
CREATE INDEX IF NOT EXISTS idx_image_verifications_stage 
ON image_verifications("stageId", "createdAt" DESC);

-- Speed up finding verifications by batch
CREATE INDEX IF NOT EXISTS idx_image_verifications_batch 
ON image_verifications("batchId", "createdAt" DESC);

-- Speed up finding verifications by farmer
CREATE INDEX IF NOT EXISTS idx_image_verifications_farmer 
ON image_verifications("farmerId", "verificationStatus");

-- Speed up finding verifications by status
CREATE INDEX IF NOT EXISTS idx_image_verifications_status 
ON image_verifications("verificationStatus", "createdAt" DESC);

-- Speed up image URL lookups (for appeals)
CREATE INDEX IF NOT EXISTS idx_image_verifications_image_url 
ON image_verifications("imageUrl");

-- 5. Stages table indexes (if exists)
-- Speed up finding stages by batch
CREATE INDEX IF NOT EXISTS idx_stages_batch_id 
ON stages("batchId", "createdAt" DESC);

-- Speed up finding stages by farmer
CREATE INDEX IF NOT EXISTS idx_stages_farmer_id 
ON stages("farmerId", "createdAt" DESC);

-- 6. Image appeals table indexes (if exists)
-- Speed up finding appeals by farmer
CREATE INDEX IF NOT EXISTS idx_appeals_farmer_status 
ON image_appeals("farmerId", "appealStatus");

-- Speed up finding pending appeals
CREATE INDEX IF NOT EXISTS idx_appeals_status_created 
ON image_appeals("appealStatus", "createdAt" DESC);

-- Speed up finding appeals by verification
CREATE INDEX IF NOT EXISTS idx_appeals_verification_id 
ON image_appeals("verificationId");

-- 7. Analyze all tables for optimal query planning
ANALYZE notifications;
ANALYZE batches;
ANALYZE users;
ANALYZE image_verifications;
ANALYZE stages;
ANALYZE image_appeals;

-- 8. Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'batches', 'users', 'image_verifications', 'stages', 'image_appeals')
ORDER BY tablename, indexname;

-- Success message
SELECT 'SUCCESS! All performance indexes created!' as status;
SELECT 'Your queries will now be MUCH faster! 🚀' as message;
