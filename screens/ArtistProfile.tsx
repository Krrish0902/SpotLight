import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ScrollView, StyleSheet, ActivityIndicator, FlatList, Dimensions, Modal, Pressable, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, MapPin, Music, Calendar, MessageSquare, Star, Pencil, LayoutDashboard, LogOut, Camera } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import BottomNav from '../components/layout/BottomNav';
import { VideoFeedItem, VideoFeedItemData } from '../components/VideoFeedItem';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Video extends VideoFeedItemData {
  video_id: string;
  thumbnail_url?: string;
  title?: string;
  views_count: number;
}

interface ScheduleEvent {
  id: string;
  date: string;
  time: string | null;
  title: string;
  venue: string | null;
  source: 'schedule' | 'booking';
  status?: string;
}

interface Props {
  navigate: (screen: string, data?: any) => void;
  artist?: any;
  userRole?: string;
  returnTo?: string;
}

export default function ArtistProfile({ navigate, artist, userRole = 'public', returnTo }: Props) {
  const { profile, appUser, fetchProfile, signOut } = useAuth();
  const isOwnProfile = artist?.id === 'me' || (appUser && artist?.user_id === appUser.id);

  // Determine the ID to fetch videos for
  const targetArtistId = isOwnProfile ? appUser?.id : artist?.user_id;

  const [videos, setVideos] = useState<Video[]>([]);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoFeedVisible, setVideoFeedVisible] = useState(false);
  const [videoFeedInitialIndex, setVideoFeedInitialIndex] = useState(0);
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

  // Refetch profile when viewing own profile to ensure we have latest data (fixes stale/empty data on tab switch)
  useEffect(() => {
    if (isOwnProfile && appUser?.id && fetchProfile) {
      fetchProfile();
    }
  }, [isOwnProfile, appUser?.id]);

  useEffect(() => {
    if (targetArtistId) {
      fetchVideos();
      fetchUpcomingEvents();
      if (!isOwnProfile) {
        fetchViewedProfile();
      }
    }
  }, [targetArtistId, isOwnProfile]);

  const fetchViewedProfile = async () => {
    if (!targetArtistId) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetArtistId)
        .single();
      if (!error && data) {
        setViewedProfile(data);
        setFetchedAt(Date.now());
      }
    } catch (e) {
      console.error('Error fetching viewed profile:', e);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!targetArtistId) return;
    setLoadingEvents(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const events: ScheduleEvent[] = [];

      const { data: scheduleData } = await supabase
        .from('artist_schedule')
        .select('schedule_id, schedule_date, start_time, title, venue')
        .eq('artist_id', targetArtistId)
        .gte('schedule_date', today)
        .order('schedule_date', { ascending: true })
        .limit(5);

      (scheduleData || []).forEach((s: any) => {
        const time = s.start_time ? String(s.start_time).slice(0, 5) : null;
        events.push({
          id: s.schedule_id,
          date: s.schedule_date,
          time,
          title: s.title,
          venue: s.venue,
          source: 'schedule',
        });
      });

      if (isOwnProfile) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('booking_id, event_date, status')
          .eq('artist_id', targetArtistId)
          .in('status', ['accepted', 'pending'])
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);

        (bookingsData || []).forEach((b: any) => {
          const d = new Date(b.event_date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          events.push({
            id: b.booking_id,
            date: dateStr,
            time: timeStr,
            title: 'Booking',
            venue: null,
            source: 'booking',
            status: b.status,
          });
        });
      }

      events.sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
      setUpcomingEvents(events.slice(0, 3));
    } catch (e) {
      console.error('Error fetching events:', e);
      setUpcomingEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!isOwnProfile) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const filePath = `${user.id}/avatar.jpg`;
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (dbError) throw dbError;

      if (fetchProfile) await fetchProfile();
      setLastUpdate(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!isOwnProfile) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1], // Standard cover aspect ratio
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const filePath = `${user.id}/cover.jpg`;
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('profiles').update({ cover_url: publicUrl }).eq('user_id', user.id);
      if (dbError) throw dbError;

      if (fetchProfile) await fetchProfile();
      setLastUpdate(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('artist_id', targetArtistId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const effectiveProfile = isOwnProfile ? profile : (viewedProfile || artist);
  const isOrganizer = userRole === 'organizer';
  const displayName = effectiveProfile?.display_name ?? effectiveProfile?.name ?? 'Artist';
  const usernameStr = effectiveProfile?.username ?? '';
  const genresStr = Array.isArray(effectiveProfile?.genres) ? effectiveProfile.genres.join(' • ') : (effectiveProfile?.genres ?? effectiveProfile?.genre ?? '');
  const cityStr = effectiveProfile?.city ?? '';
  const bioStr = effectiveProfile?.bio ?? 'Professional artist.';
  const isBoosted = effectiveProfile?.is_boosted ?? false;

  const dbAvatar =  effectiveProfile?.avatar_url;
  const navAvatar = artist?.profile_image_url ?? artist?.avatar_url ?? artist?.profile_image ?? artist?.profile_image_url;
  const defaultAvatar = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';
  const rawAvatarUrl = dbAvatar || navAvatar || defaultAvatar;
  const separator = rawAvatarUrl.includes('?') ? '&' : '?';
  const timestamp = isOwnProfile ? lastUpdate : fetchedAt;
  const displayAvatarUrl = `${rawAvatarUrl}${separator}t=${timestamp}`;

  const dbCover = effectiveProfile?.cover_url;
  const defaultCover = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';
  const rawCoverUrl = dbCover || defaultCover;
  const coverSeparator = rawCoverUrl.includes('?') ? '&' : '?';
  const displayCoverUrl = `${rawCoverUrl}${coverSeparator}t=${timestamp}`;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isOwnProfile ? 120 : 48 }]} showsVerticalScrollIndicator={false}>
        {/* ... (keep existing cover/header code) ... */}
        <View style={styles.coverWrap}>
          <LinearGradient colors={['#9333ea', '#db2777', '#f97316']} style={StyleSheet.absoluteFill} />
          <Image source={{ uri: displayCoverUrl }} style={StyleSheet.absoluteFill} />
          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={() => navigate(returnTo ?? (isOwnProfile ? 'public-home' : 'search-discover'))}>
            <ChevronLeft size={24} color="#fff" />
          </Button>
          {isOwnProfile && (
            <Pressable style={styles.editCoverBtn} onPress={handleUploadCover} disabled={uploading}>
              <Camera size={14} color="#fff" />
              <Text style={styles.editCoverText}>Change Cover</Text>
            </Pressable>
          )}
          <View style={styles.headerRight}>
            {isOwnProfile && (
              <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => navigate('edit-profile', { selectedArtist: artist ?? { id: 'me' } })}>
                <Pencil size={24} color="#fff" />
              </Button>
            )}
            <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => { }}>
              <Share2 size={24} color="#fff" />
            </Button>
          </View>
          <Pressable
            style={styles.profileImgContainer}
            onPress={handleUploadAvatar}
            disabled={!isOwnProfile || uploading}
          >
            <Image source={{ uri: displayAvatarUrl }} style={styles.profileImg} />
            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
            {isOwnProfile && !uploading && (
              <View style={styles.editBadge}>
                <Camera size={14} color="#fff" />
              </View>
            )}
          </Pressable>
        </View>

        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {isBoosted && <Badge icon={<Star size={12} color="#fff" fill="#fff" />} style={styles.boostedBadge}>Boosted</Badge>}
            </View>
            {usernameStr ? (
              <Badge style={styles.usernamePill}>@{usernameStr}</Badge>
            ) : null}
            <View style={styles.meta}>
              <Music size={20} color="#fff" />
              <Text style={styles.metaText}>{genresStr || 'Gen Z Artist'}</Text>
            </View>
            {cityStr ? (
              <View style={styles.meta}>
                <MapPin size={16} color="#fff" />
                <Text style={styles.metaText}>{cityStr}</Text>
              </View>
            ) : null}
            <Badge style={styles.availableBadge}>Available for Booking</Badge>
          </View>

          <View style={styles.actionRow}>
            {isOwnProfile && (
              <Button onPress={() => navigate(userRole === 'organizer' ? 'organizer-dashboard' : 'artist-dashboard')} style={styles.dashboardBtn}>
                <LayoutDashboard size={20} color="#fff" />
                <Text style={styles.bookBtnText}>My Dashboard</Text>
              </Button>
            )}
            {isOrganizer && !isOwnProfile && (
              <>
                <Button onPress={() => navigate('request-booking', { selectedArtist: artist })} style={styles.bookBtn}>
                  <Calendar size={20} color="#fff" />
                  <Text style={styles.bookBtnText}>Request Booking</Text>
                </Button>
                <Button variant="outline" onPress={() => navigate('messaging', { selectedArtist: artist })} style={styles.msgBtn}>
                  <MessageSquare size={20} color="#fff" />
                </Button>
              </>
            )}
            {!isOrganizer && !isOwnProfile && (
              <Button style={styles.bookBtn}><Text style={styles.bookBtnText}>Follow</Text></Button>
            )}
          </View>

          <Card style={styles.bioCard}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{bioStr || (isOwnProfile ? 'Add your bio in profile setup.' : 'Artist profile.')}</Text>
          </Card>

          {isOwnProfile && (
            <Button variant="outline" onPress={async () => { await signOut(); navigate('public-home'); }} style={[styles.signOutBtn, { alignSelf: 'stretch', width: '100%' }]}>
              <LogOut size={20} color="#fff" />
              <Text style={styles.signOutText}>Sign Out</Text>
            </Button>
          )}

          <View style={styles.statsRow}>
            <Card style={styles.statCard}><Text style={styles.statNum}>2.8K</Text><Text style={styles.statLabel}>Followers</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNum}>142</Text><Text style={styles.statLabel}>Events</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNum}>4.9</Text><Text style={styles.statLabel}>Rating</Text></Card>
          </View>

          <Tabs defaultValue="videos" fullWidth tabs={[{ value: 'videos', label: 'Videos' }, { value: 'schedule', label: 'Schedule' }, { value: 'reviews', label: 'Reviews' }]}>
            {(tab) => tab === 'videos' ? (
              <View style={styles.videoGrid}>
                {loadingVideos ? (
                  <ActivityIndicator color="#a855f7" style={{ marginTop: 20 }} />
                ) : videos.length > 0 ? (
                  videos.map((v) => (
                    <Pressable
                      key={v.video_id}
                      style={styles.videoItem}
                      onPress={() => openVideoFeed(videos.findIndex((x) => x.video_id === v.video_id))}
                    >
                      <Image
                        source={{ uri: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop' }}
                        style={styles.videoThumb}
                        resizeMode="cover"
                      />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#000']} style={[StyleSheet.absoluteFill, styles.videoOverlay]} />
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={1}>{v.title || 'Untitled'}</Text>
                        <Text style={styles.videoViews}>{v.views_count?.toLocaleString() ?? 0} views</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No videos uploaded yet.</Text>
                    {isOwnProfile && (
                      <Button variant="outline" onPress={() => navigate('upload-video')} style={{ marginTop: 12 }}>
                        <Text style={{ color: '#fff' }}>Upload Video</Text>
                      </Button>
                    )}
                  </View>
                )}
              </View>
            ) : tab === 'schedule' ? (
              <Card style={styles.scheduleCard}>
                {loadingEvents ? (
                  <ActivityIndicator color="#a855f7" style={{ marginVertical: 24 }} />
                ) : upcomingEvents.length === 0 ? (
                  <View style={styles.emptySchedule}>
                    <Calendar size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyScheduleText}>No upcoming events</Text>
                    {isOwnProfile && (
                      <Button variant="outline" size="sm" onPress={() => navigate('manage-availability')} style={{ marginTop: 12 }}>
                        <Text style={{ color: '#fff' }}>Manage Schedule</Text>
                      </Button>
                    )}
                  </View>
                ) : (
                  upcomingEvents.map((ev) => (
                    <View key={ev.id} style={styles.scheduleRow}>
                      <Calendar size={20} color="#a855f7" />
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.scheduleTitle}>{ev.title}</Text>
                        <Text style={styles.scheduleMeta}>
                          {new Date(ev.date + 'T12:00:00').toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {ev.time ? ` • ${ev.time}` : ''}
                          {ev.venue ? ` • ${ev.venue}` : ''}
                        </Text>
                        {ev.source === 'booking' && ev.status && (
                          <Badge style={styles.scheduleBadge}>{ev.status}</Badge>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </Card>
            ) : (
              <Card style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }} style={styles.reviewAvatar} />
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewer}>John Smith</Text>
                    <View style={styles.stars}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} color="#facc15" fill="#facc15" />)}</View>
                  </View>
                  <Text style={styles.reviewTime}>2 days ago</Text>
                </View>
                <Text style={styles.reviewText}>Amazing performance! Maya brought our wedding to life with her incredible voice and stage presence.</Text>
              </Card>
            )}
          </Tabs>
        </View>
      </ScrollView>
      {isOwnProfile && (
        <BottomNav activeTab="profile" navigate={navigate} userRole={userRole} isAuthenticated />
      )}

      <Modal visible={videoFeedVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.videoFeedModal}>
          <View style={styles.videoFeedHeader} pointerEvents="box-none">
            <Button variant="ghost" size="icon" onPress={() => setVideoFeedVisible(false)} style={styles.videoFeedBackBtn}>
              <ChevronLeft size={24} color="#fff" />
            </Button>
          </View>
          <FlatList
            ref={videoListRef}
            data={videos}
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
            renderItem={({ item, index }) => (
              <VideoFeedItem
                item={item}
                isActive={index === activeVideoIndex}
                muted={videoMuted}
                onToggleMute={() => setVideoMuted((m) => !m)}
                showProfileOverlay={false}
                containerHeight={SCREEN_HEIGHT}
                containerWidth={SCREEN_WIDTH}
              />
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: {},
  coverWrap: { height: 192, position: 'relative' },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  headerRight: { position: 'absolute', top: 48, right: 16, flexDirection: 'row', gap: 4 },
  iconBtn: { backgroundColor: 'rgba(0,0,0,0.4)' },
  shareBtn: {},
  profileImgContainer: {
    position: 'absolute',
    bottom: -64,
    left: 24,
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 4,
    borderColor: '#030712',
    backgroundColor: '#1f2937',
  },
  profileImg: { width: '100%', height: '100%', borderRadius: 64 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#a855f7',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#030712',
  },
  editCoverBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  editCoverText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  content: { padding: 24, paddingTop: 80 },
  profileHeader: { marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  usernamePill: { backgroundColor: '#7e22ce', borderWidth: 0, alignSelf: 'flex-start', marginBottom: 8 },
  boostedBadge: { backgroundColor: '#a855f7' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  availableBadge: { backgroundColor: 'rgba(34,197,94,0.2)', marginTop: 12, borderColor: 'rgba(34,197,94,0.3)' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bookBtn: { flex: 1, minWidth: 0, backgroundColor: '#a855f7', flexDirection: 'row', gap: 8 },
  dashboardBtn: { flex: 1, minWidth: 0, backgroundColor: '#7e22ce', flexDirection: 'row', gap: 8 },
  bookBtnText: { color: '#fff' },
  msgBtn: { borderColor: 'rgba(255,255,255,0.2)' },
  bioCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 24 },
  signOutBtn: { flexDirection: 'row', gap: 8, marginBottom: 24, borderColor: 'rgba(255,255,255,0.3)' },
  signOutText: { color: '#fff', fontSize: 16 },
  bioTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
  bioText: { color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 90, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center', overflow: 'visible' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  videoItem: { width: '47%', aspectRatio: 9 / 16, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  videoThumb: { width: '100%', height: '100%' },
  videoOverlay: { bottom: 0 },
  videoInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  videoTitle: { color: '#fff', fontWeight: '500', fontSize: 14 },
  videoViews: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  videoFeedModal: { flex: 1, backgroundColor: '#000' },
  videoFeedHeader: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  videoFeedBackBtn: {
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  scheduleCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  scheduleInfo: { flex: 1, minWidth: 0 },
  scheduleTitle: { color: '#fff', fontWeight: '600', fontSize: 15 },
  scheduleMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 4 },
  scheduleBadge: { marginTop: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(168,85,247,0.2)', borderWidth: 0 },
  emptySchedule: { alignItems: 'center', padding: 32 },
  emptyScheduleText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, marginTop: 12 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewMeta: { flex: 1 },
  reviewer: { color: '#fff', fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 2 },
  reviewTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  reviewText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  emptyState: { width: '100%', alignItems: 'center', padding: 32 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
