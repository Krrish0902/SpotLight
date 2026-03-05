-- ==========================================
-- SpotLight Seed Data
-- Run this in the Supabase SQL Editor
-- ==========================================

-- Insert 6 dummy artist users
INSERT INTO users (user_id, email, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'arjun.beats@spotlight.demo', 'artist'),
  ('a1000000-0000-0000-0000-000000000002', 'priya.vocals@spotlight.demo', 'artist'),
  ('a1000000-0000-0000-0000-000000000003', 'rahul.guitar@spotlight.demo', 'artist'),
  ('a1000000-0000-0000-0000-000000000004', 'meera.dance@spotlight.demo', 'artist'),
  ('a1000000-0000-0000-0000-000000000005', 'vikram.dj@spotlight.demo', 'artist'),
  ('a1000000-0000-0000-0000-000000000006', 'ananya.keys@spotlight.demo', 'artist')
ON CONFLICT (user_id) DO NOTHING;

-- Insert profiles for each artist
INSERT INTO profiles (user_id, display_name, username, bio, city, genres, instruments, avatar_url, cover_url, is_boosted) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Arjun Beats', 'arjun_beats',
   'Electronic music producer from Mumbai. I make beats that move your soul.',
   'Mumbai', '{"Electronic","House","Techno"}', '{"Synthesizer","Drum Machine"}',
   'https://i.pravatar.cc/400?img=11', 'https://picsum.photos/seed/artist1/800/600', true),

  ('a1000000-0000-0000-0000-000000000002', 'Priya Sharma', 'priya_vocals',
   'Classical trained vocalist exploring fusion and indie pop.',
   'Delhi', '{"Indie Pop","Classical Fusion","Bollywood"}', '{"Vocals","Harmonium"}',
   'https://i.pravatar.cc/400?img=5', 'https://picsum.photos/seed/artist2/800/600', true),

  ('a1000000-0000-0000-0000-000000000003', 'Rahul Menon', 'rahul_guitar',
   'Guitarist and songwriter. Coffee, chords, and late nights.',
   'Bangalore', '{"Rock","Blues","Acoustic"}', '{"Guitar","Bass"}',
   'https://i.pravatar.cc/400?img=12', 'https://picsum.photos/seed/artist3/800/600', false),

  ('a1000000-0000-0000-0000-000000000004', 'Meera Kapoor', 'meera_kapoor',
   'Bharatanatyam meets contemporary. Every movement tells a story.',
   'Chennai', '{"Classical Dance","Contemporary","Fusion"}', '{"Dance"}',
   'https://i.pravatar.cc/400?img=9', 'https://picsum.photos/seed/artist4/800/600', false),

  ('a1000000-0000-0000-0000-000000000005', 'DJ Vikram', 'djvikram',
   'Spinning tracks since 2015. Resident DJ at top clubs across India.',
   'Goa', '{"EDM","Trance","Progressive House"}', '{"Turntables","CDJ"}',
   'https://i.pravatar.cc/400?img=8', 'https://picsum.photos/seed/artist5/800/600', false),

  ('a1000000-0000-0000-0000-000000000006', 'Ananya Iyer', 'ananya_keys',
   'Pianist and composer. Creating soundscapes for film and theatre.',
   'Pune', '{"Film Score","Jazz","Neo-Classical"}', '{"Piano","Keyboard"}',
   'https://i.pravatar.cc/400?img=25', 'https://picsum.photos/seed/artist6/800/600', false)
ON CONFLICT (user_id) DO NOTHING;

-- Insert 2 videos per artist (using public sample video URLs)
INSERT INTO videos (artist_id, video_url, thumbnail_url, title, description, views_count, likes_count) VALUES
  -- Arjun Beats
  ('a1000000-0000-0000-0000-000000000001',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
   'https://picsum.photos/seed/arjun1/640/480',
   'Arjun Beats - Live Session', 'Electronic performance by Arjun Beats', 3200, 245),
  ('a1000000-0000-0000-0000-000000000001',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
   'https://picsum.photos/seed/arjun2/640/480',
   'Arjun Beats - Studio Jam', 'Late night studio session', 1800, 132),

  -- Priya Sharma
  ('a1000000-0000-0000-0000-000000000002',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
   'https://picsum.photos/seed/priya1/640/480',
   'Priya Sharma - Raga Fusion', 'Classical fusion vocal performance', 4500, 380),
  ('a1000000-0000-0000-0000-000000000002',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
   'https://picsum.photos/seed/priya2/640/480',
   'Priya Sharma - Acoustic Set', 'Unplugged vocal session', 2100, 198),

  -- Rahul Menon
  ('a1000000-0000-0000-0000-000000000003',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
   'https://picsum.photos/seed/rahul1/640/480',
   'Rahul Menon - Blues Night', 'Live blues guitar performance', 2800, 210),
  ('a1000000-0000-0000-0000-000000000003',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
   'https://picsum.photos/seed/rahul2/640/480',
   'Rahul Menon - Rooftop Jam', 'Acoustic rooftop session in Bangalore', 1500, 95),

  -- Meera Kapoor
  ('a1000000-0000-0000-0000-000000000004',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
   'https://picsum.photos/seed/meera1/640/480',
   'Meera Kapoor - Contemporary Piece', 'Dance performance at festival', 5200, 420),
  ('a1000000-0000-0000-0000-000000000004',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
   'https://picsum.photos/seed/meera2/640/480',
   'Meera Kapoor - Bharatanatyam', 'Traditional dance showcase', 3100, 285),

  -- DJ Vikram
  ('a1000000-0000-0000-0000-000000000005',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
   'https://picsum.photos/seed/vikram1/640/480',
   'DJ Vikram - Club Mix', 'Live DJ set at Goa beach party', 6800, 510),
  ('a1000000-0000-0000-0000-000000000005',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
   'https://picsum.photos/seed/vikram2/640/480',
   'DJ Vikram - Sunset Set', 'Trance mix at sunset', 4200, 340),

  -- Ananya Iyer
  ('a1000000-0000-0000-0000-000000000006',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
   'https://picsum.photos/seed/ananya1/640/480',
   'Ananya Iyer - Piano Sonata', 'Original piano composition', 2900, 225),
  ('a1000000-0000-0000-0000-000000000006',
   'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
   'https://picsum.photos/seed/ananya2/640/480',
   'Ananya Iyer - Film Score Demo', 'Score for an indie short film', 1700, 148);

-- Done! Verify:
SELECT u.email, p.display_name, p.city, 
       (SELECT count(*) FROM videos v WHERE v.artist_id = u.user_id) as video_count
FROM users u
JOIN profiles p ON p.user_id = u.user_id
WHERE u.role = 'artist';
