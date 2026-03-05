require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase
    .from('videos')
    .select(`
      video_id,
      video_url,
      thumbnail_url,
      title,
      description,
      likes_count,
      views_count,
      upload_date,
      artist_id,
      profiles!inner (
        user_id,
        display_name,
        username,
        avatar_url,
        genres,
        city,
        is_boosted
      )
    `)
    .order('upload_date', { ascending: false })
    .limit(10);
    
  console.log(JSON.stringify(error, null, 2));
}

run();
