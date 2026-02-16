import React, { useState, useEffect, useRef } from 'react';
import { View, Image, Pressable, StyleSheet, Dimensions, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2, User, Music, MapPin, MoreVertical, VolumeX } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');
const BOTTOM_NAV_HEIGHT = 80;

interface VideoItem {
  video_id: string;
  video_url: string;
  thumbnail_url: string;
  title: string;
  description?: string;
  likes_count: number;
  views_count: number;
  upload_date: string;
  artist_id: string;
  profiles?: {
    user_id: string;
    display_name: string;
    username: string;
    genres: string[];
    city: string;
    is_boosted: boolean;
  };
}

interface Props {
  navigate: (screen: string, data?: any) => void;
}

const VideoFeedItem = ({
  item,
  isActive,
  navigate,
  muted,
  onToggleMute,
}: {
  item: VideoItem;
  isActive: boolean;
  navigate: (screen: string, data?: any) => void;
  muted: boolean;
  onToggleMute: () => void;
}) => {
  const player = useVideoPlayer(item.video_url, player => {
    player.loop = true;
  });
  const [pausedByHold, setPausedByHold] = useState(false);

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  useEffect(() => {
    if (pausedByHold) return;
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, pausedByHold, player]);

  const handleTap = () => onToggleMute();
  const handleLongPress = () => {
    setPausedByHold(true);
    player.pause();
  };
  const handlePressOut = () => {
    if (pausedByHold) {
      setPausedByHold(false);
      if (isActive) player.play();
    }
  };

  const profile = item.profiles;

  return (
    <Pressable
      style={styles.videoContainer}
      onPress={handleTap}
      onLongPress={handleLongPress}
      onPressOut={handlePressOut}
      delayLongPress={250}
    >
      <VideoView
        player={player}
        style={styles.video}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={styles.overlay}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
      />

      {muted && (
        <View style={styles.muteBadge}>
          <VolumeX size={24} color="#fff" />
        </View>
      )}

      <View style={styles.rightActions}>
        <View style={styles.actionItem}>
          <Pressable style={styles.iconCircle}>
            <Heart size={28} color="#fff" />
          </Pressable>
          <Text style={styles.actionText}>{item.likes_count}</Text>
        </View>

        <View style={styles.actionItem}>
          <Pressable style={styles.iconCircle}>
            <Share2 size={28} color="#fff" />
          </Pressable>
          <Text style={styles.actionText}>Share</Text>
        </View>

        <View style={styles.actionItem}>
          <Pressable style={styles.iconCircle}>
            <MoreVertical size={28} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.bottomInfo}>
        <View style={styles.userInfoRow}>
          <Pressable onPress={() => navigate('artist-profile', { selectedArtist: { user_id: item.artist_id, ...profile } })} style={styles.profileBtn}>
            <View style={[styles.avatar, { backgroundColor: '#555', alignItems: 'center', justifyContent: 'center' }]}>
              <User size={20} color="#fff" />
            </View>
            <Text style={styles.username}>@{profile?.username}</Text>
          </Pressable>
          {profile?.is_boosted && <Badge style={styles.boostBadge}>Boosted</Badge>}
        </View>

        <View style={styles.metaRow}>
          {profile?.genres && (
            <View style={styles.metaItem}>
              <Music size={14} color="#ddd" />
              <Text style={styles.metaText}>{Array.isArray(profile.genres) ? profile.genres.join(' • ') : profile.genres}</Text>
            </View>
          )}
          {profile?.city && (
            <View style={styles.metaItem}>
              <MapPin size={14} color="#ddd" />
              <Text style={styles.metaText}>{profile.city}</Text>
            </View>
          )}
        </View>

        {item.title && <Text style={styles.description} numberOfLines={2}>{item.title}</Text>}
      </View>
    </Pressable>
  );
};

export default function PublicHome({ navigate }: Props) {
  const { appUser } = useAuth();
  const isAuthenticated = !!appUser;
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchVideos = async () => {
    try {
      // Direct join videos -> profiles (enabled by Foreign Key)
      const { data, error } = await supabase
        .from('videos')
        .select(`
          video_id,
          video_url,
          thumbnail_url,
          title,
          description,
          likes_count,
          views_count,
          upload_date,
          artist_id,
          profiles!inner (
            user_id,
            display_name,
            username,
            genres,
            city,
            is_boosted
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      const validVideos: VideoItem[] = (data || []).map((v: any) => {
        // Handle if profiles is returned as array or object
        const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
        return {
          ...v,
          profiles: profile,
        };
      });

      setVideos(validVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = ({ item, index }: { item: VideoItem; index: number }) => {
    return (
      <VideoFeedItem
        item={item}
        isActive={index === activeIndex}
        navigate={navigate}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.video_id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        ListEmptyComponent={
          <View style={[styles.centerContainer, { height }]}>
            <Text style={{ color: '#fff' }}>No videos found.</Text>
            <Button variant="outline" onPress={fetchVideos} style={{ marginTop: 20 }}>Refresh</Button>
          </View>
        }
      />
      <BottomNav activeTab="home" navigate={navigate} userRole={appUser?.role} isAuthenticated={isAuthenticated} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    width: width,
    height: height,
    position: 'relative',
    backgroundColor: '#000',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingBottom: BOTTOM_NAV_HEIGHT + 20,
    paddingHorizontal: 16,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  muteBadge: {
    position: 'absolute',
    top: 56,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightActions: {
    position: 'absolute',
    right: 16,
    bottom: BOTTOM_NAV_HEIGHT + 100,
    alignItems: 'center',
    gap: 20,
  },
  actionItem: {
    alignItems: 'center',
    gap: 4,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomInfo: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT + 24,
    left: 16,
    right: 80,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  profileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#fff',
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  boostBadge: {
    backgroundColor: '#a855f7',
    height: 20,
    paddingHorizontal: 6,
  },
  displayName: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
