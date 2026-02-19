import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Search, Filter, X, MapPin } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { searchArtists, Artist } from './searchService';
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from '../lib/searchHistory';

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function SearchDiscover({ navigate }: Props) {
  const { appUser, profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [recentSearches, setRecentSearches] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [distanceInput, setDistanceInput] = useState<string>('');

  useEffect(() => {
    if (appUser?.id) {
      getRecentSearches(appUser.id).then(setRecentSearches);
    } else {
      setRecentSearches([]);
    }
  }, [appUser?.id]);

  const hasDistanceFilter =
    distanceInput.trim() &&
    !isNaN(parseFloat(distanceInput.trim())) &&
    parseFloat(distanceInput.trim()) > 0;
  const showRecent = searchQuery.length < 3 && !hasDistanceFilter;

  useEffect(() => {
    let isActive = true;

    const runSearch = async () => {
      const maxDistanceKm = distanceInput.trim() ? parseFloat(distanceInput.trim()) : null;
      const hasDistanceFilter = maxDistanceKm != null && !isNaN(maxDistanceKm) && maxDistanceKm > 0;
      const hasTextSearch = searchQuery.length >= 3;

      if (hasTextSearch || hasDistanceFilter) {
        setLoading(true);
        let userLat: number | undefined;
        let userLon: number | undefined;

        if (hasDistanceFilter) {
          if (profile?.latitude != null && profile?.longitude != null) {
            userLat = profile.latitude;
            userLon = profile.longitude;
          } else {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const loc = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
                userLat = loc.coords.latitude;
                userLon = loc.coords.longitude;
              } else {
                Alert.alert('Location needed', 'Allow location access to filter by distance, or set your location in profile.');
              }
            } catch {
              Alert.alert('Location error', 'Could not get your location.');
            }
          }
        }

        if (hasDistanceFilter && (userLat == null || userLon == null)) {
          if (isActive) setLoading(false);
          return;
        }

        const results = await searchArtists(searchQuery, {
          maxDistanceKm: hasDistanceFilter ? maxDistanceKm! : undefined,
          userLat,
          userLon,
        });
        if (isActive) {
          setArtists(results ?? []);
          setLoading(false);
        }
      } else {
        if (isActive) {
          setArtists([]);
          setLoading(false);
        }
      }
    };

    const delayDebounce = setTimeout(runSearch, 400);
    return () => {
      isActive = false;
      clearTimeout(delayDebounce);
    };
  }, [searchQuery, distanceInput, profile?.latitude, profile?.longitude]);

  const handleArtistSelect = async (artist: Artist) => {
    // Save full artist object to history
    if (appUser?.id) {
      const updated = await addRecentSearch(appUser.id, artist);
      setRecentSearches(updated);
    }
    navigate('artist-profile', { selectedArtist: artist, returnTo: 'search-discover' });
  };

  const handleSearchSubmit = () => {
    // No action needed on submit, we save on selection
  };

  const handleRemoveRecent = async (id: string) => {
    if (appUser?.id) {
      const updated = await removeRecentSearch(appUser.id, id);
      setRecentSearches(updated);
    }
  };

  const handleClearAll = async () => {
    if (appUser?.id) {
      await clearRecentSearches(appUser.id);
      setRecentSearches([]);
    }
  };

  const renderItem = ({ item }: { item: Artist }) => {
    return (
      <Pressable
        style={({ pressed }) => [styles.resultItem, pressed && styles.pressedItem]}
        onPress={() => handleArtistSelect(item)}
      >
        <Image source={{ uri: item.profile_image }} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.name}>{item.display_name || item.name}</Text>
          <Text style={styles.username}>
            {item.username ? `@${item.username}` : item.genre}
          </Text>
        </View>
        {showRecent && (
          <Pressable onPress={() => handleRemoveRecent(item.id)} hitSlop={12} style={styles.removeBtn}>
            <X size={18} color="rgba(255,255,255,0.4)" />
          </Pressable>
        )}
      </Pressable>
    );
  };


  return (
    <View style={styles.container}>
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />

      <FlatList
        data={showRecent ? recentSearches : artists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Button variant="ghost" size="icon" onPress={() => navigate('public-home')}>
                <ChevronLeft size={24} color="#fff" />
              </Button>
              <Text style={styles.title}>Discover Artists</Text>
            </View>

            <View style={styles.searchRow}>
              <Input
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search artists, genres..."
                leftIcon={<Search size={20} color="rgba(255,255,255,0.4)" />}
                containerStyle={styles.searchInput}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              <Button
                size="icon"
                style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <Filter size={20} color="#fff" />
              </Button>
            </View>

            {showFilters && (
              <Card style={styles.filterCard}>
                <View style={styles.filterHeader}>
                  <MapPin size={18} color="#a855f7" />
                  <Text style={styles.filterTitle}>Filter by distance (km)</Text>
                </View>
                <Input
                  value={distanceInput}
                  onChangeText={setDistanceInput}
                  placeholder="e.g. 5, 10, 25..."
                  keyboardType="decimal-pad"
                  containerStyle={styles.distanceInput}
                />
                <Text style={styles.distanceHint}>Leave empty for no distance limit</Text>
              </Card>
            )}

            {showRecent && recentSearches.length > 0 && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <Pressable onPress={handleClearAll}>
                  <Text style={styles.clearText}>Clear All</Text>
                </Pressable>
              </View>
            )}

            {loading && <ActivityIndicator color="#a855f7" style={styles.loader} />}
          </>
        }
        ListEmptyComponent={
          !loading && !showRecent ? (
            <Text style={styles.emptyText}>No artists found.</Text>
          ) : null
        }
      />

      <BottomNav
        activeTab={"search" as any}
        navigate={navigate}
        userRole={appUser?.role}
        isAuthenticated={!!appUser}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingBottom: 120 }, // Removed vertical padding to allow edge-to-edge feel

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },

  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },

  searchInput: { flex: 1 },

  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  filterBtnActive: {
    backgroundColor: 'rgba(168,85,247,0.5)',
  },
  filterCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  distanceInput: {
    marginTop: 4,
  },
  distanceHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginTop: 8,
  },

  loader: {
    marginTop: 20,
  },

  emptyText: {
    color: '#777',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },

  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
  },

  pressedItem: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  textContainer: { flex: 1, justifyContent: 'center' },
  name: { color: '#fff', fontWeight: '600', fontSize: 16, marginBottom: 1 },
  username: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 84, // Inset separator (Avatar width + margins)
  },

  // Recent Search Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  clearText: {
    color: '#a855f7',
    fontSize: 14,
    fontWeight: '500',
  },
  removeBtn: { padding: 8, marginLeft: 8 },
});
