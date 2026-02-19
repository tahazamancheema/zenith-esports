-- =============================================
-- FIX: Storage Bucket and Permissions (Safe Version)
-- Run this ENTIRE script in Supabase SQL Editor
-- =============================================

-- Step 1: Create the 'uploads' bucket (This usually works, if not, create it manually in dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Step 2: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own uploads" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
-- Also drop old names if they exist
DROP POLICY IF EXISTS "Give users access to own folder 1gz3d_0" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1gz3d_1" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1gz3d_2" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder 1gz3d_3" ON storage.objects;

-- Step 3: Create policies (These are allowed)

-- A. Public Read Access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- B. Authenticated Upload Access
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'uploads' );

-- C. Update Access
CREATE POLICY "Users can update own uploads"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner );

-- D. Delete Access
CREATE POLICY "Users can delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner );

-- Done!
