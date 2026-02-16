-- Create a foreign key linking videos.artist_id directly to profiles.user_id
-- This enables PostgREST to detect the relationship for direct joins (videos -> profiles)

ALTER TABLE videos
ADD CONSTRAINT videos_artist_id_fkey_profiles
FOREIGN KEY (artist_id)
REFERENCES profiles (user_id)
ON DELETE CASCADE;

-- Also create one for tickets -> profiles if needed later (good practice)
-- ALTER TABLE tickets
-- ADD CONSTRAINT tickets_user_id_fkey_profiles
-- FOREIGN KEY (user_id)
-- REFERENCES profiles (user_id)
-- ON DELETE CASCADE;
