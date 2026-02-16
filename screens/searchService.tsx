import { supabase } from '../lib/supabase';

// Define the shape of the data returned to the UI
export interface Artist {
  id: string;
  user_id: string;
  name: string;
  display_name?: string | null;
  username?: string | null;
  genre: string;
  location: string;
  profile_image: string;
  is_available: boolean;
  is_boosted: boolean;
}

// Define the shape of the raw database row
interface ProfileRow {
  id?: string;
  profile_id?: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  genres: string[] | string | null; // Handle both array or string cases safely
  city: string | null;
  profile_image_url: string | null;
  is_boosted: boolean | null;
}

export const searchArtists = async (query: string): Promise<Artist[]> => {
  try {
    // Sanitize: Remove characters that break PostgREST syntax (commas, parens)
    const sanitizedQuery = query.replace(/[,()]/g, ' ').trim();
    
    if (!sanitizedQuery || sanitizedQuery.length < 3) return [];

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${sanitizedQuery}%,username.ilike.%${sanitizedQuery}%`)
      .limit(20);

    if (error) {
      console.error('Supabase search error:', error);
      return [];
    }

    return (data || []).map((profile: ProfileRow) => ({
      id: profile.id || profile.profile_id || 'unknown',
      user_id: profile.user_id,
      name: profile.display_name || profile.username || 'Unknown Artist',
      display_name: profile.display_name,
      username: profile.username,
      genre: Array.isArray(profile.genres) ? profile.genres.join(' • ') : (profile.genres || 'Music'),
      location: profile.city || 'Unknown Location',
      profile_image:
        profile.profile_image_url ||
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      is_available: true,
      is_boosted: profile.is_boosted ?? false,
    }));
  } catch (error) {
    console.error('Unexpected error in searchArtists:', error);
    return [];
  }
};
