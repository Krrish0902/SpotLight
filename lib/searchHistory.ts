import AsyncStorage from '@react-native-async-storage/async-storage';
import { Artist } from '../screens/searchService';
import { supabase } from './supabase';
import { getSuspendedUserIds } from './suspension';

const MAX_HISTORY_ITEMS = 8;

// Helper to generate user-specific storage key
const getStorageKey = (userId: string) => `spotlight_recent_artists_${userId}`;
const PLACEHOLDER_MARKERS = [
  'images.unsplash.com/photo-1511671782779-c97d3d27a1d4',
  'images.unsplash.com/photo-1535713875002-d1d0cf377fde',
];

const isPlaceholderImage = (url?: string | null) =>
  !url || PLACEHOLDER_MARKERS.some((marker) => url.includes(marker));

const hydrateRecentSearchImages = async (items: Artist[]): Promise<Artist[]> => {
  const candidates = items.filter((item) => isPlaceholderImage(item.profile_image));
  if (candidates.length === 0) return items;

  const userIds = Array.from(new Set(candidates.map((item) => item.user_id).filter(Boolean)));
  if (userIds.length === 0) return items;

  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, avatar_url, profile_image_url')
    .in('user_id', userIds);

  if (!profiles || profiles.length === 0) return items;

  const imageByUserId = (profiles as any[]).reduce((acc: Record<string, string>, p: any) => {
    const image = p.avatar_url || p.profile_image_url;
    if (image) acc[p.user_id] = image;
    return acc;
  }, {});

  return items.map((item) => {
    if (!isPlaceholderImage(item.profile_image)) return item;
    const image = imageByUserId[item.user_id];
    return image ? { ...item, profile_image: image } : item;
  });
};

const filterSuspendedArtists = async (items: Artist[]): Promise<Artist[]> => {
  const userIds = Array.from(new Set(items.map((item) => item.user_id).filter(Boolean)));
  if (userIds.length === 0) return items;

  const suspended = await getSuspendedUserIds(userIds);
  if (suspended.size === 0) return items;
  return items.filter((item) => !suspended.has(item.user_id));
};

export const getRecentSearches = async (userId: string): Promise<Artist[]> => {
  if (!userId) return [];
  try {
    const jsonValue = await AsyncStorage.getItem(getStorageKey(userId));
    const parsed: Artist[] = jsonValue != null ? JSON.parse(jsonValue) : [];
    const hydrated = await hydrateRecentSearchImages(parsed);
    const activeOnly = await filterSuspendedArtists(hydrated);
    // Persist upgraded history to avoid repeated lookups
    const shouldPersist =
      activeOnly.length !== parsed.length ||
      activeOnly.some((item, idx) => item.profile_image !== parsed[idx]?.profile_image || item.id !== parsed[idx]?.id);
    if (shouldPersist) {
      await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(activeOnly));
    }
    return activeOnly;
  } catch (e) {
    console.error('Failed to load search history', e);
    return [];
  }
};

export const addRecentSearch = async (userId: string, artist: Artist): Promise<Artist[]> => {
  if (!userId) return [];
  try {
    const currentHistory = await getRecentSearches(userId);
    
    // Remove duplicates based on ID
    const filtered = currentHistory.filter((item) => item.id !== artist.id);

    // Add to top and limit
    const newHistory = [artist, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to save search history', e);
    return [];
  }
};

export const removeRecentSearch = async (userId: string, artistId: string): Promise<Artist[]> => {
  if (!userId) return [];
  try {
    const currentHistory = await getRecentSearches(userId);
    const newHistory = currentHistory.filter((item) => item.id !== artistId);
    await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(newHistory));
    return newHistory;
  } catch (e) {
    console.error('Failed to remove search item', e);
    return [];
  }
};

export const clearRecentSearches = async (userId: string): Promise<Artist[]> => {
  if (!userId) return [];
  try {
    await AsyncStorage.removeItem(getStorageKey(userId));
    return [];
  } catch (e) {
    console.error('Failed to clear search history', e);
    return [];
  }
};
