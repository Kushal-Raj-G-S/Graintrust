-- ============================================
-- FIX NOTIFICATIONS TABLE - RLS POLICIES
-- Run this if you got the "userId does not exist" error
-- ============================================

-- Step 1: Drop the table if it exists (to start fresh)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TYPE IF EXISTS "NotificationType" CASCADE;

-- Step 2: Create NotificationType enum
CREATE TYPE "NotificationType" AS ENUM (
  'IMAGE_VERIFIED',      -- Image verified as REAL
  'IMAGE_FLAGGED',       -- Image flagged as FAKE
  'BATCH_VERIFIED',      -- Full batch verified and synced to blockchain
  'BATCH_REJECTED',      -- Batch rejected
  'STAGE_COMPLETE',      -- Farming stage completed
  'SYSTEM_ALERT'         -- General system notifications
);

-- Step 3: Create notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,                           -- Recipient user ID (TEXT to match users.id)
  "type" "NotificationType" NOT NULL,               -- Type of notification
  "title" TEXT NOT NULL,                            -- Notification title
  "message" TEXT NOT NULL,                          -- Notification message
  "read" BOOLEAN NOT NULL DEFAULT false,            -- Read status
  "actionUrl" TEXT,                                 -- Optional URL for action button
  "actionText" TEXT,                                -- Optional text for action button
  "metadata" JSONB,                                 -- Additional data (batchId, stageId, imageUrl, etc.)
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign key to users table (users.id is TEXT type)
  CONSTRAINT fk_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Step 4: Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON notifications("userId");
CREATE INDEX idx_notifications_type ON notifications("type");
CREATE INDEX idx_notifications_read ON notifications("read");
CREATE INDEX idx_notifications_created_at ON notifications("createdAt" DESC);
CREATE INDEX idx_notifications_user_unread ON notifications("userId", "read") WHERE "read" = false;

-- Step 5: Enable Row Level Security (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS Policies (FIXED - userId is TEXT type)
-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT
  USING ("userId" = auth.uid()::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE
  USING ("userId" = auth.uid()::text);

-- System can insert notifications for any user (from backend)
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT
  WITH CHECK (true);

-- Step 7: Create trigger for auto-updating updatedAt field
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores user notifications for farmers about image verifications, batch status, etc.';
COMMENT ON COLUMN notifications."userId" IS 'User ID who receives this notification (TEXT type matching users.id)';
COMMENT ON COLUMN notifications."type" IS 'Type of notification (IMAGE_VERIFIED, IMAGE_FLAGGED, etc.)';
COMMENT ON COLUMN notifications."title" IS 'Short notification title';
COMMENT ON COLUMN notifications."message" IS 'Detailed notification message';
COMMENT ON COLUMN notifications."read" IS 'Whether user has read this notification';
COMMENT ON COLUMN notifications."metadata" IS 'JSON data containing batchId, stageId, imageUrl, rejectionReason, etc.';

-- Step 9: Verify setup
SELECT 'SUCCESS! Notifications table created with fixed RLS policies!' as status;
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'notifications'
ORDER BY ordinal_position;
