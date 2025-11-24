-- Supabase Storage Setup SQL Commands
-- Run these commands in your Supabase SQL Editor

-- 1. First, create the storage bucket (you can also do this in the Storage UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'graintrust-images',
  'graintrust-images', 
  true, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS (Row Level Security) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for public read access (anyone can view images)
CREATE POLICY "Public read access for graintrust-images" ON storage.objects
FOR SELECT USING (bucket_id = 'graintrust-images');

-- 4. Create policy for authenticated upload (logged in users can upload)
CREATE POLICY "Authenticated upload for graintrust-images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'graintrust-images' 
  AND auth.role() = 'authenticated'
);

-- 5. Create policy for authenticated delete (logged in users can delete)
CREATE POLICY "Authenticated delete for graintrust-images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'graintrust-images' 
  AND auth.role() = 'authenticated'
);

-- 6. Create policy for authenticated update (logged in users can update metadata)
CREATE POLICY "Authenticated update for graintrust-images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'graintrust-images' 
  AND auth.role() = 'authenticated'
) WITH CHECK (
  bucket_id = 'graintrust-images'
);
