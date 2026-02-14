import React, { useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Search, Filter, MapPin, Music } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';

const mockArtists = [
  { id: 1, name: 'Maya Rivers', genre: 'Jazz • Soul', location: 'New York, NY', image: 'photo-1493225457124-a3eb161ffa5f', available: true, boosted: true },
  { id: 2, name: 'The Neon Lights', genre: 'Indie Rock', location: 'Austin, TX', image: 'photo-1516450360452-9312f5e86fc7', available: true, boosted: false },
  { id: 3, name: 'DJ Eclipse', genre: 'Electronic', location: 'Los Angeles, CA', image: 'photo-1571609572760-64c0cd10b5ca', available: false, boosted: true },
  { id: 4, name: 'Sofia Chen', genre: 'Classical', location: 'San Francisco', image: 'photo-1558618666-fcd25c85cd64', available: true, boosted: false },
  { id: 5, name: 'Marcus Stone', genre: 'Hip Hop', location: 'Atlanta, GA', image: 'photo-1493225457124-a3eb161ffa5f', available: true, boosted: false },
  { id: 6, name: 'Luna Sky', genre: 'Pop', location: 'Miami, FL', image: 'photo-1516450360452-9312f5e86fc7', available: true, boosted: true },
];

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function SearchDiscover({ navigate }: Props) {
  const { appUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
            style={styles.searchInput}
          />
          <Button size="icon" style={styles.filterBtn} onPress={() => setShowFilters(!showFilters)}>
            <Filter size={20} color="#fff" />
          </Button>
        </View>

        {showFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterPills}>
            <Badge style={[styles.pill, { backgroundColor: '#a855f7' }]}>All Genres</Badge>
            <Badge variant="outline" style={styles.pill}>Jazz</Badge>
            <Badge variant="outline" style={styles.pill}>Rock</Badge>
            <Badge variant="outline" style={styles.pill}>Electronic</Badge>
            <Badge variant="outline" style={styles.pill}>Hip Hop</Badge>
          </ScrollView>
        )}

        <View style={styles.grid}>
          {mockArtists.map((artist) => (
            <Card key={artist.id} onPress={() => navigate('artist-profile', { selectedArtist: artist })} style={styles.artistCard}>
              <View style={styles.artistImageWrap}>
                <Image
                  source={{ uri: `https://images.unsplash.com/${artist.image}?w=400&h=500&fit=crop` }}
                  style={styles.artistImage}
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#000']} style={StyleSheet.absoluteFill} />
                <View style={styles.badges}>
                  {artist.boosted && <Badge style={[styles.imgBadge, { backgroundColor: '#9333ea' }]}>⭐ Boosted</Badge>}
                  {artist.available && <Badge style={[styles.imgBadge, { backgroundColor: '#22c55e' }]}>Available</Badge>}
                </View>
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  <View style={styles.artistMeta}>
                    <Music size={12} color="rgba(255,255,255,0.7)" />
                    <Text style={styles.artistGenre}>{artist.genre}</Text>
                  </View>
                  <View style={styles.artistMeta}>
                    <MapPin size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.artistLocation}>{artist.location}</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="search" navigate={navigate} userRole={appUser?.role} isAuthenticated={!!appUser} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  searchInput: { flex: 1 },
  filterBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  filterPills: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  pill: { marginRight: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between' },
  artistCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    padding: 0,
  },
  artistImageWrap: { aspectRatio: 3 / 4, position: 'relative' },
  artistImage: { width: '100%', height: '100%' },
  badges: { position: 'absolute', top: 8, right: 8, gap: 4 },
  imgBadge: { fontSize: 10 },
  artistInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  artistName: { color: '#fff', fontWeight: '600', fontSize: 14 },
  artistMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  artistGenre: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  artistLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
});
