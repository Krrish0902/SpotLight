import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Image, Platform } from 'react-native';
import { Text } from './ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2, User, Music, MapPin, MoreVertical, VolumeX, MessageSquare, Check } from 'lucide-react-native';
import { Badge } from './ui/Badge';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { track } from '../lib/analytics';

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
  const { appUser } = useAuth();
  const [messageRequestStatus, setMessageRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isSendingRequest, setIsSendingRequest] = useState(false);

  useEffect(() => {
    // Check initial request status when component mounts
    const checkMessageRequestStatus = async () => {
      if (!appUser || !profile) return;
      
      try {
        const { data, error } = await supabase
          .from('message_requests')
          .select('status')
          // Check if current user has requested this creator
          .eq('sender_id', appUser.id)
          .eq('receiver_id', profile.user_id)
          .maybeSingle();
          
        if (data && !error) {
          setMessageRequestStatus(data.status as any);
        }
      } catch (err) {
        console.log('Error checking message request status:', err);
      }
    };
    
    checkMessageRequestStatus();
  }, [appUser?.id, profile?.user_id]);

  const handleMessageRequest = async () => {
    if (!appUser || !profile || isSendingRequest || messageRequestStatus !== 'none') return;
    
    // Don't allow messaging yourself
    if (appUser.id === profile.user_id) return;

    // Lock immediately to prevent double-taps
    setIsSendingRequest(true);
    
    try {
      // Double check it wasn't created in the last few ms by another device/tap
      const { data: existing } = await supabase
        .from('message_requests')
        .select('id')
        .eq('sender_id', appUser.id)
        .eq('receiver_id', profile.user_id)
        .maybeSingle();
        
      if (existing) {
        setMessageRequestStatus('pending');
        return;
      }

      const { data, error } = await supabase
        .from('message_requests')
        .insert({
          sender_id: appUser.id,
          receiver_id: profile.user_id,
          status: 'pending'
        });
        
      if (!error) {
        setMessageRequestStatus('pending');
      }
    } catch (err) {
      console.error('Failed to send message request:', err);
      setMessageRequestStatus('none'); // Revert on failure
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleLike = async () => {
    if (!appUser || !item.artist_id) return;
    try {
      track.like(
        item.artist_id,
        item.video_id,
        appUser.id,
        player ? Math.floor(player.currentTime) : 0
      );
    } catch (err) {
      console.error('Failed to log like analytics', err);
    }
  };

  const handleShare = async () => {
    if (!appUser || !item.artist_id) return;
    try {
      track.share(
        item.artist_id,
        item.video_id,
        appUser.id
      );
    } catch (err) {
      console.error('Failed to log share analytics', err);
    }
  };

  useEffect(() => {
    player.muted = muted;
  }, [muted, player]);

  const reachedCheckpoints = useRef<Set<number>>(new Set());
  const RETENTION_CHECKPOINTS = [10, 25, 50, 75, 90, 100];
  const watchStartTime = useRef<number>(0);

  useEffect(() => {
    if (pausedByHold) return;
    if (isActive) {
      player.play();
      watchStartTime.current = Date.now();
      reachedCheckpoints.current = new Set();
      
      const interval = setInterval(() => {
        if (!player.duration || player.duration === 0) return;
        const pct = Math.floor((player.currentTime / player.duration) * 100);
        RETENTION_CHECKPOINTS.forEach(cp => {
          if (pct >= cp) reachedCheckpoints.current.add(cp);
        });
      }, 500);
      
      return () => {
        clearInterval(interval);
        if (item.artist_id && item.artist_id !== appUser?.id) {
            const watchSeconds = (Date.now() - watchStartTime.current) / 1000;
            const completionPct = player.duration > 0 ? (player.currentTime / player.duration) * 100 : 0;
            const retentionBuckets = RETENTION_CHECKPOINTS.reduce((acc, cp) => {
              acc[String(cp)] = reachedCheckpoints.current.has(cp);
              return acc;
            }, {} as Record<string, boolean>);

            track.videoView({
              artistId: item.artist_id,
              videoId: item.video_id,
              viewerId: appUser?.id || undefined,
              watchSeconds,
              completionPct,
              retentionBuckets
            });
        }
      };
    } else {
      player.pause();
    }
  }, [isActive, pausedByHold, player, item.video_id, item.artist_id, appUser?.id]);

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
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' as any }]}
        contentFit="cover"
        nativeControls={false}
      />

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)']}
        style={[styles.overlay, { height: containerHeight, pointerEvents: 'none' as any }]}
      />

      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent']}
        style={[styles.topGradient, { pointerEvents: 'none' as any }]}
      />

      {muted && (
        <View style={[styles.muteBadge, { pointerEvents: 'none' as any }]}>
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
            {appUser?.id !== profile.user_id && (
              <View style={styles.actionItem}>
                <Pressable 
                  style={[
                    styles.iconCircle, 
                    messageRequestStatus !== 'none' && { backgroundColor: 'rgba(253, 242, 255, 0.15)', borderColor: '#FDF2FF' }
                  ]}
                  onPress={handleMessageRequest}
                  disabled={isSendingRequest || messageRequestStatus !== 'none'}
                >
                  {messageRequestStatus !== 'none' ? (
                    <Check size={24} color="#FDF2FF" />
                  ) : (
                    <MessageSquare size={24} color="#fff" />
                  )}
                </Pressable>
                <Text style={styles.actionText}>
                  {messageRequestStatus === 'none' ? 'Chat' : 
                   messageRequestStatus === 'pending' ? 'Sent' : 'Chat'}
                </Text>
              </View>
            )}
            <View style={styles.actionItem}>
              <Pressable style={styles.iconCircle} onPress={handleLike}>
                <Heart size={24} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>{item.likes_count ?? 0}</Text>
            </View>
            <View style={styles.actionItem}>
              <Pressable style={styles.iconCircle} onPress={handleShare}>
                <Share2 size={24} color="#fff" />
              </Pressable>
              <Text style={styles.actionText}>Share</Text>
            </View>
            <View style={styles.actionItem}>
              <Pressable style={styles.iconCircle}>
                <MoreVertical size={24} color="#fff" />
              </Pressable>
            </View>
          </View>

          <View style={styles.bottomInfoWrapper}>
            <View style={styles.glassPlate}>
              <View style={styles.userInfoRow}>
                <Pressable onPress={onProfilePress} style={styles.profileBtn}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatar} resizeMode="cover" />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#333', alignItems: 'center', justifyContent: 'center' }]}>
                      <User size={18} color="#fff" />
                    </View>
                  )}
                  <Text style={styles.username}>@{profile?.username ?? 'artist'}</Text>
                </Pressable>
                {profile?.is_boosted && <Badge style={styles.boostBadge}>Pro</Badge>}
              </View>
              {item.title ? (
                <Text style={styles.description} numberOfLines={2}>{item.title}</Text>
              ) : null}
              <View style={styles.metaRow}>
                {genresStr ? (
                  <View style={styles.metaItem}>
                    <Music size={12} color="#8E8E93" />
                    <Text style={styles.metaText}>{genresStr}</Text>
                  </View>
                ) : null}
                {profile?.city ? (
                  <View style={styles.metaItem}>
                    <MapPin size={12} color="#8E8E93" />
                    <Text style={styles.metaText}>{profile.city}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.bottomInfoCompact, { pointerEvents: 'none' as any }]}>
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
    right: 12,
    bottom: BOTTOM_NAV_HEIGHT + 110,
    alignItems: 'center',
    gap: 20,
  },
  actionItem: { alignItems: 'center', gap: 6 },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4
  },
  bottomInfoWrapper: {
    position: 'absolute',
    bottom: BOTTOM_NAV_HEIGHT + 16,
    left: 12,
    right: 76,
  },
  glassPlate: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 16,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  profileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  username: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.5,
  },
  boostBadge: { backgroundColor: '#FDF2FF', paddingHorizontal: 8, height: 22 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: '#8E8E93', fontSize: 13, fontWeight: '500' },
  description: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  },bottomInfoCompact: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  compactTitle: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    
  },
  compactViews: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
});
