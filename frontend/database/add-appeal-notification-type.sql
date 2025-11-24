-- ============================================
-- ADD IMAGE_APPEAL TO NotificationType ENUM
-- Run this in Supabase SQL Editor
-- ============================================

-- Add IMAGE_APPEAL to the existing NotificationType enum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'IMAGE_APPEAL';

-- Verify the enum values
SELECT enumlabel 
FROM pg_enum 
WHERE enumtypid = '"NotificationType"'::regtype
ORDER BY enumlabel;

-- Success message
SELECT 'SUCCESS! IMAGE_APPEAL notification type added!' as status;
SELECT 'Admins will now receive appeal notifications! 🎉' as message;
