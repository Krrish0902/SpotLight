import React, { useState } from 'react';
import { View, Image, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2, User } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';

interface Artist {
  id: number;
  name: string;
  genre: string;
  location: string;
  likes: number;
  isLiked: boolean;
}

const mockArtists: Artist[] = [
  { id: 1, name: 'Maya Rivers', genre: 'Jazz • Soul', location: 'New York, NY', likes: 2847, isLiked: false },
  { id: 2, name: 'The Neon Lights', genre: 'Indie Rock', location: 'Austin, TX', likes: 5234, isLiked: false },
  { id: 3, name: 'DJ Eclipse', genre: 'Electronic • House', location: 'Los Angeles, CA', likes: 8921, isLiked: false },
  { id: 4, name: 'Sofia Chen', genre: 'Classical • Piano', location: 'San Francisco, CA', likes: 3456, isLiked: false },
  { id: 5, name: 'Marcus Stone', genre: 'Hip Hop • R&B', location: 'Atlanta, GA', likes: 12453, isLiked: false },
];

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function PublicHome({ navigate }: Props) {
  const { appUser } = useAuth();
  const isAuthenticated = !!appUser;
  const [artists, setArtists] = useState(mockArtists);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleLike = () => {
    setArtists(prev => prev.map((artist, idx) =>
      idx === currentIndex
        ? { ...artist, isLiked: !artist.isLiked, likes: artist.isLiked ? artist.likes - 1 : artist.likes + 1 }
        : artist
    ));
  };

  const currentArtist = artists[currentIndex];

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=1400&fit=crop' }}
        style={styles.bgImage}
      />
      <LinearGradient
        colors={['rgba(147,51,234,0.4)', 'rgba(219,39,119,0.4)', 'rgba(249,115,22,0.4)']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={[StyleSheet.absoluteFill, { top: 0, height: 100 }]}
      />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.logo}>Spotlight</Text>
      </View>

      {/* Artist Info */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', '#000']}
        style={styles.artistInfo}
      >
        <Text style={styles.artistName}>{currentArtist.name}</Text>
        <Text style={styles.artistGenre}>{currentArtist.genre}</Text>
        <View style={styles.location}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText}>{currentArtist.location}</Text>
        </View>
        <View style={styles.badges}>
          <Badge variant="secondary" style={styles.badge}>Available</Badge>
          <Badge style={[styles.badge, { backgroundColor: '#9333ea', borderWidth: 0 }]}>Boosted</Badge>
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionBtn}>
          <View style={[styles.actionCircle, currentArtist.isLiked ? styles.actionCircleLiked : undefined]}>
            <Heart size={28} color="#fff" fill={currentArtist.isLiked ? '#fff' : 'transparent'} />
          </View>
          <Text style={styles.actionLabel}>{currentArtist.likes}</Text>
        </Pressable>
        <Pressable onPress={() => navigate('artist-profile', { selectedArtist: currentArtist })} style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <User size={28} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Profile</Text>
        </Pressable>
        <Pressable style={styles.actionBtn}>
          <View style={styles.actionCircle}>
            <Share2 size={28} color="#fff" />
          </View>
          <Text style={styles.actionLabel}>Share</Text>
        </Pressable>
      </View>

      <BottomNav activeTab="home" navigate={navigate} userRole={appUser?.role} isAuthenticated={isAuthenticated} />
    </View>
  );
}

const { width, height } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  artistInfo: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    padding: 24,
  },
  artistName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  artistGenre: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 4,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ade80',
  },
  locationText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 0,
  },
  actions: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    flexDirection: 'column',
    gap: 24,
  },
  actionBtn: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionCircleLiked: {
    backgroundColor: '#ec4899',
  },
  actionLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
