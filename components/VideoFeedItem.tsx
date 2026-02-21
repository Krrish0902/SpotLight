import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Image } from 'react-native';
import { Text } from './ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2, User, Music, MapPin, MoreVertical, VolumeX } from 'lucide-react-native';
import { Badge } from './ui/Badge';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');
const BOTTOM_NAV_HEIGHT = 80;

export interface VideoFeedItemData {
  video_id: string;
  video_url: string;
  thumbnail_url?: string;
  title?: string;
  likes_count?: number;
  views_count?: number;
  artist_id?: string;
  profiles?: {
    user_id: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
    genres?: string[] | string;
    city?: string;
    is_boosted?: boolean;
  };
}

interface VideoFeedItemProps {
  item: VideoFeedItemData;
  isActive: boolean;
  muted: boolean;
  onToggleMute: () => void;
  onProfilePress?: () => void;
  navigate?: (screen: string, data?: any) => void;
  /** If true, show full overlay with profile link. If false, compact view for profile page */
  showProfileOverlay?: boolean;
  /** Override container dimensions (for embedded mode) */
  containerHeight?: number;
  containerWidth?: number;
}

export function VideoFeedItem({
  item,
  isActive,
  muted,
  onToggleMute,
  onProfilePress,
  navigate,
  showProfileOverlay = true,
  containerHeight = height,
  containerWidth = width,
}: VideoFeedItemProps) {
  const player = useVideoPlayer(item.video_url, (p) => {
    p.loop = true;
  });
  const [pausedByHold, setPausedByHold] = useState(false);
  const profile = item.profiles;

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

  const genresStr = profile?.genres
    ? Array.isArray(profile.genres)
      ? profile.genres.join(' • ')
      : String(profile.genres)
    : '';

  return (
    <View style={[styles.videoContainer, { height: containerHeight, width: containerWidth }]}>
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={[styles.overlay, { height: containerHeight }]}
        pointerEvents="none"
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={styles.topGradient}
        pointerEvents="none"
      />

      {muted && (
        <View style={styles.muteBadge} pointerEvents="none">
          <VolumeX size={24} color="#fff" />
        </View>
      )}

      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={handleTap}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        delayLongPress={250}
      />

      {showProfileOverlay && profile && onProfilePress ? (
        <>
          <View style={styles.rightActions}>
            <View style={styles.actionItem}>
              <Pressable style={styles.iconCircle}>
                <Heart size={28} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>{item.likes_count ?? 0}</Text>
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
              <Pressable onPress={onProfilePress} style={styles.profileBtn}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.avatar} resizeMode="cover" />
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#555', alignItems: 'center', justifyContent: 'center' }]}>
                    <User size={20} color="#fff" />
                  </View>
                )}
                <Text style={styles.username}>@{profile?.username ?? 'artist'}</Text>
              </Pressable>
              {profile?.is_boosted && <Badge style={styles.boostBadge}>Boosted</Badge>}
            </View>
            <View style={styles.metaRow}>
              {genresStr ? (
                <View style={styles.metaItem}>
                  <Music size={14} color="#ddd" />
                  <Text style={styles.metaText}>{genresStr}</Text>
                </View>
              ) : null}
              {profile?.city ? (
                <View style={styles.metaItem}>
                  <MapPin size={14} color="#ddd" />
                  <Text style={styles.metaText}>{profile.city}</Text>
                </View>
              ) : null}
            </View>
            {item.title ? (
              <Text style={styles.description} numberOfLines={2}>{item.title}</Text>
            ) : null}
          </View>
        </>
      ) : (
        <View style={styles.bottomInfoCompact} pointerEvents="none">
          <Text style={styles.compactTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
          <Text style={styles.compactViews}>{item.views_count?.toLocaleString() ?? 0} views</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    position: 'relative',
    backgroundColor: '#000',
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
    right: 16,
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
  actionItem: { alignItems: 'center', gap: 4 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  boostBadge: { backgroundColor: '#a855f7', height: 20, paddingHorizontal: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  bottomInfoCompact: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  compactTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  compactViews: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
});
