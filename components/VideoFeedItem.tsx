import React, { useState, useEffect, useRef } from 'react';
import { View, Pressable, StyleSheet, Dimensions, Image, Platform, Alert, Modal } from 'react-native';
import { Text } from './ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Share2, User, Music, MapPin, MoreVertical, VolumeX, MessageSquare, Check } from 'lucide-react-native';
import { Badge } from './ui/Badge';
import { useVideoPlayer, VideoView } from 'expo-video';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';
import { track } from '../lib/analytics';
import { Textarea } from './ui/Textarea';
import { Button } from './ui/Button';

const { width, height } = Dimensions.get('window');
const BOTTOM_NAV_HEIGHT = 80;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

async function callRpcRaw<T>(rpcName: string, params: Record<string, any>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpcName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      apikey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    },
    body: JSON.stringify(params),
  });

  const text = await res.text();
  if (!res.ok) {
    // Keep error info usable for debugging.
    throw new Error(`RPC ${rpcName} failed (${res.status}): ${text}`);
  }

  return JSON.parse(text) as T;
}

function parseRpcFirstRow(result: any): any {
  if (Array.isArray(result)) return result[0] ?? {};
  return result ?? {};
}

function parseRpcBoolean(result: any): boolean {
  if (typeof result === 'boolean') return result;
  if (Array.isArray(result) && result.length > 0) {
    const first = result[0];
    if (typeof first === 'object' && first) {
      if ('liked' in first) return !!(first as any).liked;
      const firstVal = (Object.values(first)[0] as any) ?? false;
      return !!firstVal;
    }
  }
  if (typeof result === 'object' && result) {
    if ('liked' in result) return !!(result as any).liked;
    const firstVal = (Object.values(result)[0] as any) ?? false;
    return !!firstVal;
  }
  return false;
}

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
  /**
   * When true, show the right rail (like / share / report, and message when enabled).
   * If omitted, defaults to the legacy behavior: same as `showProfileOverlay && profile && onProfilePress`.
   */
  showFeedActions?: boolean;
  /**
   * Message button on the rail. Defaults to `showProfileOverlay` when `showFeedActions` is on
   * (feed shows message; profile video modal typically omits it).
   */
  showMessageAction?: boolean;
  /** Bottom offset for the action rail (e.g. lower value when there is no tab bar). */
  feedActionsBottomOffset?: number;
  /** Override container dimensions (for embedded mode) */
  containerHeight?: number;
  containerWidth?: number;
}

function safePlayerCall<T>(fn: () => T, fallback?: T): T | undefined {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

function safePlay(player: any) {
  try {
    const result = player?.play?.();
    if (result && typeof result.then === 'function') {
      result.catch(() => {
        // Web autoplay may fail without user interaction; ignore.
      });
    }
  } catch {
    // Ignore released/invalid shared object errors.
  }
}

export function VideoFeedItem({
  item,
  isActive,
  muted,
  onToggleMute,
  onProfilePress,
  navigate,
  showProfileOverlay = true,
  showFeedActions: showFeedActionsProp,
  showMessageAction: showMessageActionProp,
  feedActionsBottomOffset,
  containerHeight = height,
  containerWidth = width,
}: VideoFeedItemProps) {
  const videoSource = item.video_url ?? '';
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
  });
  const playerRef = useRef(player);
  playerRef.current = player;
  const [pausedByHold, setPausedByHold] = useState(false);
  const profile = item.profiles;
  const { appUser } = useAuth();
  const [messageRequestStatus, setMessageRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState<number | undefined>(item.likes_count);
  const [liking, setLiking] = useState(false);

  useEffect(() => {
    // Reset local like UI when the tile changes.
    setLiked(false);
    setLikesCount(item.likes_count);
  }, [item.video_id, item.likes_count]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!appUser?.id) return;
      if (!isActive) return;
      if (!item.video_id) return;

      try {
        let likedData: any = null;
        let error: any = null;
        try {
          const rpcRes = await supabase.rpc('is_video_liked', {
            p_video_id: item.video_id,
          });
          likedData = rpcRes.data;
          error = rpcRes.error;
        } catch (e: any) {
          // Supabase-js validates against a local schema cache; if it's stale, fall back to raw RPC.
          const msg = String(e?.message ?? '');
          if (e?.code === 'PGRST202' || msg.includes('schema cache')) {
            likedData = await callRpcRaw<any>('is_video_liked', { p_video_id: item.video_id });
          } else {
            throw e;
          }
        }

        if (cancelled) return;
        if (error) throw error;
        setLiked(parseRpcBoolean(likedData));
      } catch {
        // If the check fails, keep the conservative default (outline).
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [appUser?.id, item.video_id, isActive]);

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
    if (!appUser) return;
    if (!item.video_id) return;
    if (liking) return;

    setLiking(true);
    try {
      // Toggle like in DB and get updated state.
      let resData: any = null;
      let error: any = null;
      try {
        const rpcRes = await supabase.rpc('toggle_video_like', {
          p_video_id: item.video_id,
        });
        resData = rpcRes.data;
        error = rpcRes.error;
      } catch (e: any) {
        const msg = String(e?.message ?? '');
        if (e?.code === 'PGRST202' || msg.includes('schema cache')) {
          resData = await callRpcRaw<any>('toggle_video_like', { p_video_id: item.video_id });
        } else {
          throw e;
        }
      }

      if (error) throw error;
      const firstRow = parseRpcFirstRow(resData);
      const likedNow = !!firstRow?.liked;
      const nextLikesCount = firstRow?.likes_count as number | undefined;
      setLiked(likedNow);
      setLikesCount(nextLikesCount);

      // Log analytics only when user newly likes.
      if (likedNow && item.artist_id) {
        const t = safePlayerCall(() => Math.floor(playerRef.current.currentTime), 0) ?? 0;
        track.like(item.artist_id, item.video_id, appUser.id, t);
      }
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setLiking(false);
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

  const createVideoReport = async () => {
    if (!appUser?.id) {
      Alert.alert('Login required', 'Please sign in to report this video.');
      return;
    }
    if (!reportReason) {
      Alert.alert('Reason required', 'Please select a reason for the report.');
      return;
    }
    try {
      setReportSubmitting(true);
      const { error } = await supabase.from('reports').insert({
        report_type: 'video',
        target_id: item.video_id,
        reported_by: appUser.id,
        reason: reportNote.trim() ? `${reportReason}: ${reportNote.trim()}` : reportReason,
        status: 'pending',
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportNote('');
      setReportReason('spam');
      Alert.alert('Report submitted', 'Thanks. Our admins will review this video.');
    } catch (e: any) {
      console.error('Failed to report video:', e);
      Alert.alert('Error', e?.message || 'Unable to submit report right now.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReportVideo = () => setShowReportModal(true);

  useEffect(() => {
    safePlayerCall(() => {
      playerRef.current.muted = muted;
    });
  }, [muted, videoSource]);

  const reachedCheckpoints = useRef<Set<number>>(new Set());
  const RETENTION_CHECKPOINTS = [10, 25, 50, 75, 90, 100];
  const watchStartTime = useRef<number>(0);
  const lastDurationRef = useRef(0);
  const lastCurrentTimeRef = useRef(0);

  useEffect(() => {
    if (pausedByHold) return;
    if (isActive) {
      safePlay(playerRef.current);
      watchStartTime.current = Date.now();
      reachedCheckpoints.current = new Set();
      
      const interval = setInterval(() => {
        safePlayerCall(() => {
          const p = playerRef.current;
          const dur = p.duration;
          const cur = p.currentTime;
          lastDurationRef.current = dur;
          lastCurrentTimeRef.current = cur;
          if (!dur || dur === 0) return;
          const pct = Math.floor((cur / dur) * 100);
          RETENTION_CHECKPOINTS.forEach(cp => {
            if (pct >= cp) reachedCheckpoints.current.add(cp);
          });
        });
      }, 500);
      
      return () => {
        clearInterval(interval);
        if (item.artist_id && item.artist_id !== appUser?.id) {
            const watchSeconds = (Date.now() - watchStartTime.current) / 1000;
            const dur = lastDurationRef.current;
            const cur = lastCurrentTimeRef.current;
            const completionPct = dur > 0 ? (cur / dur) * 100 : 0;
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
      safePlayerCall(() => {
        playerRef.current.pause();
      });
    }
  }, [isActive, pausedByHold, videoSource, item.video_id, item.artist_id, appUser?.id]);

  const handleTap = () => onToggleMute();
  const handleLongPress = () => {
    setPausedByHold(true);
    safePlayerCall(() => {
      playerRef.current.pause();
    });
  };
  const handlePressOut = () => {
    if (pausedByHold) {
      setPausedByHold(false);
      if (isActive) {
        safePlay(playerRef.current);
      }
    }
  };

  const genresStr = profile?.genres
    ? Array.isArray(profile.genres)
      ? profile.genres.join(' • ')
      : String(profile.genres)
    : '';

  const feedActionsEnabled =
    showFeedActionsProp !== undefined
      ? showFeedActionsProp
      : !!(showProfileOverlay && profile && onProfilePress);

  const showMessageOnRail =
    feedActionsEnabled &&
    profile &&
    appUser?.id !== profile.user_id &&
    (showMessageActionProp !== undefined ? showMessageActionProp : showProfileOverlay);

  const actionsBottom =
    feedActionsBottomOffset !== undefined
      ? feedActionsBottomOffset
      : BOTTOM_NAV_HEIGHT + 100;

  return (
    <View style={[styles.videoContainer, { height: containerHeight, width: containerWidth }]}>
      <VideoView
        key={item.video_id}
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

      {feedActionsEnabled ? (
        <>
          <View style={[styles.rightActions, { bottom: actionsBottom }]}>
            {showMessageOnRail ? (
              <Pressable
                style={[
                  styles.iconCircle,
                  messageRequestStatus !== 'none' && { backgroundColor: 'rgba(168, 85, 247, 0.4)', borderColor: '#a855f7' },
                ]}
                onPress={handleMessageRequest}
                disabled={isSendingRequest || messageRequestStatus !== 'none'}
              >
                {messageRequestStatus !== 'none' ? (
                  <Check size={28} color="#fff" />
                ) : (
                  <MessageSquare size={26} color="#fff" />
                )}
              </Pressable>
            ) : null}
            <Pressable style={styles.iconCircle} onPress={handleLike} disabled={liking}>
              <Heart size={28} color={liked ? '#EF4444' : '#fff'} />
            </Pressable>
            <Pressable style={styles.iconCircle} onPress={handleShare}>
              <Share2 size={28} color="#fff" />
            </Pressable>
            <Pressable style={styles.iconCircle} onPress={handleReportVideo}>
              <MoreVertical size={28} color="#fff" />
            </Pressable>
          </View>

          {showProfileOverlay && profile && onProfilePress ? (
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
          ) : (
            <View style={[styles.bottomInfoCompact, { pointerEvents: 'none' as any }]}>
              <Text style={styles.compactTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
              <Text style={styles.compactViews}>{item.views_count?.toLocaleString() ?? 0} views</Text>
            </View>
          )}
        </>
      ) : (
        <View style={[styles.bottomInfoCompact, { pointerEvents: 'none' as any }]}>
          <Text style={styles.compactTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
          <Text style={styles.compactViews}>{item.views_count?.toLocaleString() ?? 0} views</Text>
        </View>
      )}

      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModal}>
            <Text style={styles.reportTitle}>Report Video</Text>
            <Text style={styles.reportSubtitle}>Tell us what is wrong with this content.</Text>
            <View style={styles.reasonWrap}>
              {[
                { id: 'spam', label: 'Spam' },
                { id: 'harassment', label: 'Harassment' },
                { id: 'inappropriate_content', label: 'Inappropriate' },
                { id: 'copyright', label: 'Copyright' },
              ].map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.reasonChip, reportReason === r.id && styles.reasonChipActive]}
                  onPress={() => setReportReason(r.id)}
                >
                  <Text style={[styles.reasonChipText, reportReason === r.id && styles.reasonChipTextActive]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            <Textarea
              placeholder="Add note (optional)"
              value={reportNote}
              onChangeText={setReportNote}
              style={styles.noteInput}
            />
            <View style={styles.modalActions}>
              <Button variant="outline" style={styles.modalCancelBtn} onPress={() => setShowReportModal(false)} disabled={reportSubmitting}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Button>
              <Button style={styles.modalSubmitBtn} onPress={createVideoReport} disabled={reportSubmitting}>
                <Text style={styles.modalSubmitText}>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    gap: 16,
  },
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
    ...Platform.select({
      web: { textShadow: '1px 1px 3px rgba(0,0,0,0.7)' as any },
      default: { textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
    })
  },
  boostBadge: { backgroundColor: '#a855f7', height: 20, paddingHorizontal: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  description: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    ...Platform.select({
      web: { textShadow: '1px 1px 3px rgba(0,0,0,0.7)' as any },
      default: { textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
    })
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
    ...Platform.select({
      web: { textShadow: '1px 1px 3px rgba(0,0,0,0.7)' as any },
      default: { textShadowColor: 'rgba(0,0,0,0.7)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 }
    })
  },
  compactViews: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  reportModal: {
    backgroundColor: '#0B1220',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 16,
  },
  reportTitle: { color: '#fff', fontSize: 22, fontWeight: '800' },
  reportSubtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 12 },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reasonChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  reasonChipActive: {
    backgroundColor: 'rgba(34,211,238,0.18)',
    borderColor: 'rgba(34,211,238,0.45)',
  },
  reasonChipText: { color: 'rgba(255,255,255,0.76)', fontSize: 13, fontWeight: '600' },
  reasonChipTextActive: { color: '#CFFAFE' },
  noteInput: { marginBottom: 12 },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalCancelBtn: { flex: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' },
  modalSubmitBtn: { flex: 1, backgroundColor: '#FDF2FF' },
  modalCancelText: { color: '#fff', fontWeight: '700' },
  modalSubmitText: { color: '#162447', fontWeight: '800' },
});
