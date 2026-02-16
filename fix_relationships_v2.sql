-- Create a UNIQUE constraint on profiles.user_id if one doesn't exist
-- This is REQUIRED for it to be referenced by a foreign key
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'profiles'::regclass 
        AND conname = 'profiles_user_id_unique'
    ) THEN
        ALTER TABLE profiles ADD CONSTRAINT profiles_user_id_unique UNIQUE (user_id);
    END IF;
END $$;

-- Drop the old foreign key constraint if it exists (so we can recreate it)
ALTER TABLE videos
DROP CONSTRAINT IF EXISTS videos_artist_id_fkey_profiles;

-- Create the foreign key constraint
ALTER TABLE videos
ADD CONSTRAINT videos_artist_id_fkey_profiles
FOREIGN KEY (artist_id)
REFERENCES profiles (user_id)
ON DELETE CASCADE;
