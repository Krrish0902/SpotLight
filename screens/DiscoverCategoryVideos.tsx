import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { ChevronLeft } from 'lucide-react-native';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { VideoFeedItem, VideoFeedItemData } from '../components/VideoFeedItem';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  navigate: (screen: string, data?: any) => void;
  filter?: { type: 'genre' | 'instrument'; value: string };
}

interface DbProfile {
  user_id: string;
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  genres?: string[] | string | null;
  instruments?: string[] | string | null;
  city?: string | null;
  is_boosted?: boolean | null;
}

interface RowVideo {
  video_id: string;
  title: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  artist_id: string | null;
  genres?: string[] | string | null;
  instruments?: string[] | string | null;
  tags?: string[] | string | null;
  likes_count?: number | null;
  views_count?: number | null;
  upload_date?: string | null;
  profiles?: DbProfile | null;
}

function toVideoFeedItemData(v: RowVideo): VideoFeedItemData {
  const p = v.profiles;
  const profiles = p
    ? {
        user_id: p.user_id,
        display_name: p.display_name ?? undefined,
        username: p.username ?? undefined,
        avatar_url: p.avatar_url ?? undefined,
        genres: p.genres ?? undefined,
        city: p.city ?? undefined,
        is_boosted: p.is_boosted ?? undefined,
      }
    : undefined;

  return {
    video_id: v.video_id,
    video_url: v.video_url ?? '',
    thumbnail_url: v.thumbnail_url ?? undefined,
    title: v.title ?? undefined,
    likes_count: v.likes_count ?? undefined,
    views_count: v.views_count ?? undefined,
    artist_id: v.artist_id ?? undefined,
    profiles,
  };
}

const normalizeValues = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop';

export default function DiscoverCategoryVideos({ navigate, filter }: Props) {
  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<RowVideo[]>([]);
  const [videoFeedVisible, setVideoFeedVisible] = useState(false);
  const [videoFeedInitialIndex, setVideoFeedInitialIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);
  const videoListRef = useRef<FlatList>(null);

  const onViewableVideosChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const openVideoFeed = (index: number) => {
    setVideoFeedInitialIndex(index);
    setActiveVideoIndex(index);
    setVideoFeedVisible(true);
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('videos')
          .select(`
            video_id,
            title,
            video_url,
            thumbnail_url,
            artist_id,
            genres,
            instruments,
            tags,
            likes_count,
            views_count,
            upload_date,
            profiles (
              user_id,
              display_name,
              username,
              avatar_url,
              genres,
              instruments,
              city,
              is_boosted
            )
          `)
          .order('upload_date', { ascending: false });

        if (error) throw error;
        const raw = (data || []) as any[];
        const rows: RowVideo[] = raw.map((v) => {
          const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
          return { ...v, profiles: profile ?? null };
        });

        if (!filter?.value) {
          setVideos(rows);
          return;
        }

        const needle = filter.value.trim().toLowerCase();
        const filtered = rows.filter((row) => {
          const pool = [
            ...(filter.type === 'genre' ? normalizeValues(row.genres) : normalizeValues(row.instruments)),
            ...normalizeValues(row.tags),
            ...(filter.type === 'genre'
              ? normalizeValues(row.profiles?.genres)
              : normalizeValues(row.profiles?.instruments)),
          ].map((v) => v.toLowerCase());
          return pool.includes(needle);
        });
        setVideos(filtered);
      } catch (err) {
        console.error('Failed to load filtered videos', err);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [filter?.type, filter?.value]);

  const title = useMemo(() => {
    if (!filter?.value) return 'Discover Videos';
    return `${filter.type === 'genre' ? 'Genre' : 'Instrument'}: ${filter.value}`;
  }, [filter?.type, filter?.value]);

  const feedData: VideoFeedItemData[] = useMemo(
    () => videos.map((v) => toVideoFeedItemData(v)),
    [videos]
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={StyleSheet.absoluteFill} />

      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('search-discover')}>
          <ChevronLeft size={22} color="#fff" />
        </Button>
        <View style={styles.headerText}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.subtitle}>{videos.length} video{videos.length === 1 ? '' : 's'}</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color="#22D3EE" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {videos.length > 0 ? (
            <View style={styles.videoGrid}>
              {videos.map((v) => (
                <Pressable
                  key={v.video_id}
                  style={styles.videoItem}
                  onPress={() => openVideoFeed(videos.findIndex((x) => x.video_id === v.video_id))}
                >
                  <Image
                    source={{ uri: v.thumbnail_url || DEFAULT_THUMB }}
                    style={styles.videoThumb}
                    contentFit="cover"
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.videoInfo}>
                    <Text style={styles.gridVideoTitle} numberOfLines={1}>
                      {v.title || 'Untitled'}
                    </Text>
                    <Text style={styles.videoViews}>{v.views_count?.toLocaleString() ?? 0} views</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No videos found</Text>
              <Text style={styles.emptyText}>Try another card from Discover.</Text>
            </View>
          )}
        </ScrollView>
      )}

      <BottomNav
        activeTab={'search' as any}
        navigate={navigate}
        userRole={appUser?.role}
        isAuthenticated={!!appUser}
      />

      <Modal visible={videoFeedVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.videoFeedModal}>
          <View style={styles.videoFeedHeader} pointerEvents="box-none">
            <Button variant="ghost" size="icon" onPress={() => setVideoFeedVisible(false)} style={styles.videoFeedBackBtn}>
              <ChevronLeft size={24} color="#fff" />
            </Button>
          </View>
          <FlatList
            ref={videoListRef}
            data={feedData}
            keyExtractor={(item) => item.video_id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableVideosChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            initialScrollIndex={videoFeedInitialIndex}
            getItemLayout={(_d, index) => ({
              length: SCREEN_HEIGHT,
              offset: SCREEN_HEIGHT * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
              return (
                <VideoFeedItem
                  item={item}
                  isActive={index === activeVideoIndex}
                  muted={videoMuted}
                  onToggleMute={() => setVideoMuted((m) => !m)}
                  showProfileOverlay
                  navigate={navigate}
                  onProfilePress={() =>
                    navigate('artist-profile', {
                      selectedArtist: { user_id: item.artist_id, ...profile },
                      returnTo: 'discover-videos',
                      discoverFilter: filter,
                    })
                  }
                  feedActionsBottomOffset={insets.bottom + 96}
                  containerHeight={SCREEN_HEIGHT}
                  containerWidth={SCREEN_WIDTH}
                />
              );
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: 64,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerText: { flex: 1 },
  pageTitle: { color: '#fff', fontSize: 21, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    paddingTop: 8,
  },
  videoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  videoItem: {
    width: '47%',
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  videoThumb: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  videoInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  gridVideoTitle: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 6,
  },
  videoViews: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyWrap: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyText: { color: 'rgba(255,255,255,0.58)', marginTop: 6 },
  videoFeedModal: { flex: 1, backgroundColor: '#050A18' },
  videoFeedHeader: { position: 'absolute', top: 56, left: 16, zIndex: 10 },
  videoFeedBackBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 8,
  },
});
