-- ============================================
-- GRAINTRUST SUPABASE DATABASE SETUP
-- Copy and paste this entire script into Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================

-- Step 1: Create Role enum for user types
CREATE TYPE "Role" AS ENUM ('FARMER', 'MANUFACTURER', 'CONSUMER', 'ADMIN');

-- Step 2: Create users table (for signup/signin)
CREATE TABLE "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSUMER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "avatar" TEXT,
    "profilePicture" TEXT,
    "phone" TEXT,
    "bio" TEXT,
    "organization" TEXT,
    "location" TEXT,
    "state" TEXT,
    "country" TEXT,
    "specialization" TEXT,
    "experience" TEXT,
    "farmSize" TEXT,
    "organizationType" TEXT,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create index for faster email lookups
CREATE INDEX "users_email_idx" ON "users"("email");

-- Step 4: Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 5: Trigger to auto-update updatedAt field
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Verify setup
SELECT 'SUCCESS! Users table created in Supabase!' as status;
SELECT COUNT(*) as total_users FROM "users";
