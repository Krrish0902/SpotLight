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
  latitude?: number | null;
  longitude?: number | null;
}

// Define the shape of the raw database row from search_profiles RPC
interface ProfileRow {
  profile_id: string;
  user_id: string;
  display_name: string | null;
  username: string | null;
  genres: string[] | string | null;
  instruments: string[] | string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  is_boosted: boolean | null;
}

/** Haversine distance in km */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface SearchOptions {
  maxDistanceKm?: number;
  userLat?: number;
  userLon?: number;
}

export const searchArtists = async (
  query: string,
  options?: SearchOptions
): Promise<Artist[]> => {
  try {
    const sanitizedQuery = query.replace(/[,()]/g, ' ').trim();
    if (!sanitizedQuery || sanitizedQuery.length < 3) return [];

    const { maxDistanceKm, userLat, userLon } = options || {};
    const rpcParams: Record<string, unknown> = {
      search_text: sanitizedQuery,
    };
    if (maxDistanceKm != null && userLat != null && userLon != null) {
      rpcParams.max_dist_km = maxDistanceKm;
      rpcParams.user_lat = userLat;
      rpcParams.user_lon = userLon;
    }

    const { data, error } = await supabase.rpc('search_profiles', rpcParams);

    if (error) {
      console.error('Supabase search error:', error);
      return [];
    }

    return (data || []).map((profile: ProfileRow) => ({
      id: profile.profile_id || profile.user_id || 'unknown',
      user_id: profile.user_id,
      name: profile.display_name || profile.username || 'Unknown Artist',
      display_name: profile.display_name,
      username: profile.username,
      genre: Array.isArray(profile.genres) ? profile.genres.join(' • ') : (profile.genres || 'Music'),
      location: profile.city || 'Unknown Location',
      profile_image:
        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop',
      is_available: true,
      is_boosted: profile.is_boosted ?? false,
      latitude: profile.latitude,
      longitude: profile.longitude,
    })).slice(0, 20);
  } catch (error) {
    console.error('Unexpected error in searchArtists:', error);
    return [];
  }
};
