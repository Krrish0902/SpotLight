import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  TextInput,
  Keyboard,
} from 'react-native';
import * as Location from 'expo-location';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, X, MapPin, SlidersHorizontal, Music2, Guitar, Star } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { searchArtists, Artist } from './searchService';
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from '../lib/searchHistory';
import { POPULAR_GENRES, POPULAR_INSTRUMENTS } from '../components/MultiSelectWithCustom';

interface Props {
  navigate: (screen: string, data?: any) => void;
  /** Incremented by App when returning to this screen via pop (edge swipe / Android back). */
  blurOnPopNonce?: number;
}

const ACCENT = '#22D3EE';
const ACCENT_SOFT = 'rgba(34,211,238,0.35)';
const ACCENT_TEXT_DARK = '#0A2A33';
const GENRE_GRADIENTS: Array<[string, string]> = [
  ['#B9EFD3', '#6BC3A8'],
  ['#5127F5', '#3613D1'],
  ['#FF1744', '#E3002B'],
  ['#F03CB2', '#CB1993'],
  ['#3B82F6', '#1D4ED8'],
  ['#14B8A6', '#0F766E'],
];
const INSTRUMENT_GRADIENTS: Array<[string, string]> = [
  ['#F59E0B', '#D97706'],
  ['#22D3EE', '#0891B2'],
  ['#A78BFA', '#7C3AED'],
  ['#FB7185', '#E11D48'],
  ['#34D399', '#059669'],
  ['#F472B6', '#DB2777'],
];

const buildCards = (
  options: string[],
  type: 'genre' | 'instrument',
  gradients: Array<[string, string]>
): Array<{
  label: string;
  value: string;
  type: 'genre' | 'instrument';
  colors: [string, string];
}> =>
  options.map((value, index) => ({
    label: value,
    value,
    type,
    colors: gradients[index % gradients.length],
  }));

const DISCOVER_CARDS = [
  ...buildCards(POPULAR_GENRES, 'genre', GENRE_GRADIENTS),
  ...buildCards(POPULAR_INSTRUMENTS, 'instrument', INSTRUMENT_GRADIENTS),
];

export default function SearchDiscover({ navigate, blurOnPopNonce = 0 }: Props) {
  const { appUser, profile } = useAuth();
  const searchInputRef = useRef<TextInput>(null);

  const renderDiscoverCardIcon = (type: 'genre' | 'instrument', value: string) => {
    if (value === 'Other') return <Star size={18} color="#FFFFFF" />;
    return type === 'genre'
      ? <Music2 size={18} color="#FFFFFF" />
      : <Guitar size={18} color="#FFFFFF" />;
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [artists, setArtists] = useState<Artist[]>([]);
  const [recentSearches, setRecentSearches] = useState<Artist[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [distanceInput, setDistanceInput] = useState<string>('');
  const [searchFocused, setSearchFocused] = useState<boolean>(false);

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
  const showRecent = searchFocused && searchQuery.length < 3 && !hasDistanceFilter;
  const hasActiveSearch = searchQuery.length >= 3 || hasDistanceFilter;

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
                const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
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

  useEffect(() => {
    if (blurOnPopNonce === 0) return;
    setSearchFocused(false);
    searchInputRef.current?.blur();
    Keyboard.dismiss();
  }, [blurOnPopNonce]);

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
    const avatarSource = item.profile_image?.trim()
      ? { uri: item.profile_image }
      : { uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' };
    return (
      <Pressable
        style={({ pressed }) => [styles.resultCard, pressed && styles.pressedItem]}
        onPress={() => handleArtistSelect(item)}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.textContainer}>
          <Text style={styles.name} numberOfLines={1}>{item.display_name || item.name}</Text>
          <Text style={styles.username} numberOfLines={1}>
            {item.username ? `@${item.username}` : item.genre}
          </Text>
          <Text style={styles.location} numberOfLines={1}>{item.location}</Text>
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
      <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={StyleSheet.absoluteFill} />

      <FlatList
        data={showRecent ? recentSearches : artists}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Discover Artists</Text>
            </View>

            <View style={styles.searchRow}>
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search artists, genres..."
                leftIcon={<Search size={20} color="rgba(255,255,255,0.45)" />}
                containerStyle={styles.searchInput}
                style={styles.searchInputField}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                onSubmitEditing={handleSearchSubmit}
                returnKeyType="search"
              />
              <Button
                size="icon"
                style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
                onPress={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal size={19} color="#fff" />
              </Button>
            </View>

            {!hasActiveSearch && !showRecent && (
              <View style={styles.discoverSection}>
                <Text style={styles.discoverSectionTitle}>Browse by genre & instrument</Text>
                <View style={styles.discoverGrid}>
                  {DISCOVER_CARDS.map((card) => (
                    <Pressable
                      key={`${card.type}-${card.value}`}
                      style={styles.discoverCardWrap}
                      onPress={() =>
                        navigate('discover-videos', {
                          discoverFilter: { type: card.type, value: card.value },
                        })
                      }
                    >
                      <LinearGradient colors={card.colors} style={styles.discoverCard}>
                        <View style={styles.discoverCardTop}>
                          <View style={styles.discoverIconWrap}>
                            {renderDiscoverCardIcon(card.type, card.value)}
                          </View>
                        </View>
                        <Text style={styles.discoverCardText}>{card.label}</Text>
                        <Text style={styles.discoverCardSub}>{card.type === 'genre' ? 'Genre' : 'Instrument'}</Text>
                      </LinearGradient>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {showFilters && (
              <Card style={styles.filterCard}>
                <View style={styles.filterHeader}>
                  <MapPin size={18} color={ACCENT} />
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
                <View style={styles.filterActions}>
                  <Button
                    variant="outline"
                    style={styles.filterActionBtn}
                    onPress={() => setDistanceInput('')}
                  >
                    <Text style={styles.filterActionText}>Reset</Text>
                  </Button>
                  <Button
                    style={[styles.filterActionBtn, styles.applyBtn]}
                    onPress={() => setShowFilters(false)}
                  >
                    <Text style={styles.filterActionTextPrimary}>Apply</Text>
                  </Button>
                </View>
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

            {loading && <ActivityIndicator color={ACCENT} style={styles.loader} />}
          </>
        }
        ListEmptyComponent={
          !loading && !showRecent && hasActiveSearch && artists.length === 0 ? (
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
  listContent: { paddingBottom: 120, paddingTop: 8 },

  header: {
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 22,
  },

  searchInput: { flex: 1 },
  searchInputField: {
    minHeight: 56,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  filterBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  filterBtnActive: {
    backgroundColor: ACCENT_SOFT,
  },
  filterCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
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
  filterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  filterActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 100,
  },
  applyBtn: {
    backgroundColor: ACCENT,
  },
  filterActionText: {
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '700',
  },
  filterActionTextPrimary: {
    color: ACCENT_TEXT_DARK,
    fontWeight: '800',
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
    display: 'none',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  pressedItem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textContainer: { flex: 1, justifyContent: 'center' },
  name: { color: '#ffffff', fontWeight: '700', fontSize: 16, marginBottom: 2, letterSpacing: -0.2 },
  username: { color: 'rgba(255,255,255,0.72)', fontSize: 13, fontWeight: '500' },
  location: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 3 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  discoverSection: {
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  discoverSectionTitle: {
    color: 'rgba(255,255,255,0.82)',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 12,
  },
  discoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  discoverCardWrap: {
    width: '48%',
  },
  discoverCard: {
    borderRadius: 14,
    height: 116,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  discoverCardTop: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  discoverIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverCardText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  discoverCardSub: {
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
  // Recent Search Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  clearText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '500',
  },
  removeBtn: { padding: 8, marginLeft: 8 },
});
