-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE user_role AS ENUM ('artist', 'organizer', 'public', 'admin');
CREATE TYPE booking_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
CREATE TYPE payment_status AS ENUM ('pending', 'success', 'failed');

-- Table: users
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR UNIQUE NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Table: profiles
CREATE TABLE profiles (
    profile_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    display_name VARCHAR NOT NULL,
    username VARCHAR UNIQUE,
    bio TEXT,
    city VARCHAR,
    latitude DECIMAL,
    longitude DECIMAL,
    genres TEXT[],
    instruments TEXT[],
    is_boosted BOOLEAN DEFAULT false,
    boost_expiry TIMESTAMP,
    -- UI additions based on your requirements
    avatar_url TEXT,
    cover_url TEXT,
    artist_url TEXT,
    age INTEGER,
    profile_video_url TEXT
);

-- Table: videos
CREATE TABLE videos (
    video_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    title VARCHAR,
    description TEXT,
    tags TEXT[],
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    upload_date TIMESTAMP DEFAULT now()
);

-- Table: events
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    event_date TIMESTAMP NOT NULL,
    location_coords POINT,
    poster_url TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Table: bookings
CREATE TABLE bookings (
    booking_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organizer_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    artist_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    event_date TIMESTAMP NOT NULL,
    status booking_status DEFAULT 'pending',
    price DECIMAL,
    message TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Table: availability
CREATE TABLE availability (
    availability_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artist_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    unavailable_date DATE NOT NULL
);

-- Table: contests
CREATE TABLE contests (
    contest_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Table: contest_submissions
CREATE TABLE contest_submissions (
    submission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_id UUID REFERENCES contests(contest_id) ON DELETE CASCADE,
    artist_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos(video_id) ON DELETE CASCADE,
    is_winner BOOLEAN DEFAULT false,
    UNIQUE(contest_id, artist_id)
);

-- Table: payments
CREATE TABLE payments (
    payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
    amount DECIMAL,
    transaction_ref VARCHAR,
    status payment_status,
    created_at TIMESTAMP DEFAULT now()
);

-- Setup RLS (Row Level Security) - Basic open policies for development
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON users FOR SELECT USING (true);
CREATE POLICY "Allow individual insert/update" ON users FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow individual insert/update" ON profiles FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access" ON videos FOR SELECT USING (true);
CREATE POLICY "Allow individual insert/update" ON videos FOR ALL USING (auth.uid() = artist_id);

CREATE POLICY "Allow public read access" ON events FOR SELECT USING (true);
CREATE POLICY "Allow individual insert/update" ON events FOR ALL USING (auth.uid() = organizer_id);
