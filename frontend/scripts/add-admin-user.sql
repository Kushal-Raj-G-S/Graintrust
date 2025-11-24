-- Add Admin User to Database
-- Run this SQL script in your Supabase SQL Editor

-- First, check if admin user exists
SELECT * FROM users WHERE email = 'admin@graintrust.com';

-- Insert admin user (if not exists)
-- Password is 'admin123' hashed with bcrypt
INSERT INTO users (
  id,
  email,
  name,
  password,
  role,
  phone,
  bio,
  organization,
  location,
  state,
  country,
  "organizationType",
  specialization,
  experience,
  "isVerified",
  "onboardingComplete",
  "lastLogin",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'admin@graintrust.com',
  'Kushal Raj G S',
  '$2a$10$YourHashedPasswordHere',  -- You need to replace this with actual bcrypt hash
  'ADMIN',
  '+91-9876543213',
  'Platform administrator with expertise in agricultural technology and supply chain management.',
  'GrainTrust Platform',
  'Mumbai',
  'Maharashtra',
  'India',
  'government',
  'Platform management, Analytics',
  '20+',
  true,
  true,
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  "isVerified" = true,
  "onboardingComplete" = true,
  role = 'ADMIN';

-- Verify the admin user was created
SELECT id, email, name, role, "isVerified", "onboardingComplete" 
FROM users 
WHERE email = 'admin@graintrust.com';
