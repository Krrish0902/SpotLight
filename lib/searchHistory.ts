import AsyncStorage from '@react-native-async-storage/async-storage';
import { Artist } from '../screens/searchService';

const MAX_HISTORY_ITEMS = 8;

// Helper to generate user-specific storage key
const getStorageKey = (userId: string) => `spotlight_recent_artists_${userId}`;

export const getRecentSearches = async (userId: string): Promise<Artist[]> => {
  if (!userId) return [];
  try {
    const jsonValue = await AsyncStorage.getItem(getStorageKey(userId));
    return jsonValue != null ? JSON.parse(jsonValue) : [];
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
