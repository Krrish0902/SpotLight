import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Platform,
  Dimensions,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  MapPin,
  Settings,
  CalendarDays,
  Star,
  Ticket,
  ChevronRight,
  ChevronLeft,
  Share2,
  LogOut,
  Pencil,
} from 'lucide-react-native';
import { Text } from '../components/ui/Text';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  navigate: (screen: string, data?: any) => void;
}

interface UpcomingEvent {
  ticket_id: string;
  quantity: number;
  total_amount: number;
  booked_at: string;
  events: {
    event_id: string;
    title: string;
    event_date: string;
    location_name: string | null;
    city: string | null;
    poster_url: string | null;
  } | null;
}

interface MyReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  artist_id: string;
  reviewer_display_name: string | null;
  artist_profile: {
    display_name: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          color={i <= rating ? '#FBBF24' : 'rgba(255,255,255,0.15)'}
          fill={i <= rating ? '#FBBF24' : 'transparent'}
        />
      ))}
    </View>
  );
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function PublicDashboard({ navigate }: Props) {
  const insets = useSafeAreaInsets();
  const { appUser, profile, fetchProfile, signOut } = useAuth();

  const [followingCount, setFollowingCount] = useState(0);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [myReviews, setMyReviews] = useState<MyReview[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowingCount = useCallback(async () => {
    if (!appUser?.id) return;
    const { count } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', appUser.id);
    setFollowingCount(count ?? 0);
  }, [appUser?.id]);

  const fetchUpcomingEvents = useCallback(async () => {
    if (!appUser?.id) return;
    setLoadingEvents(true);
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          ticket_id,
          quantity,
          total_amount,
          booked_at,
          events!inner (
            event_id,
            title,
            event_date,
            location_name,
            city,
            poster_url
          )
        `)
        .eq('user_id', appUser.id)
        .gte('events.event_date', now)
        .order('booked_at', { ascending: false });

      if (error) throw error;
      setUpcomingEvents((data as unknown as UpcomingEvent[]) || []);
    } catch (e) {
      console.error('fetchUpcomingEvents error:', e);
    } finally {
      setLoadingEvents(false);
    }
  }, [appUser?.id]);

  const fetchMyReviews = useCallback(async () => {
    if (!appUser?.id) return;
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('artist_reviews')
        .select(`
          id,
          rating,
          comment,
          created_at,
          artist_id,
          reviewer_display_name,
          artist_profile:profiles!artist_reviews_artist_fk (
            display_name,
            username,
            avatar_url
          )
        `)
        .eq('user_id', appUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const reviews = (data || []).map((r: any) => ({
        ...r,
        artist_profile: Array.isArray(r.artist_profile) ? r.artist_profile[0] : r.artist_profile,
      }));
      setMyReviews(reviews);
    } catch (e) {
      console.error('fetchMyReviews error:', e);
    } finally {
      setLoadingReviews(false);
    }
  }, [appUser?.id]);

  const loadAll = useCallback(async () => {
    await Promise.all([fetchFollowingCount(), fetchUpcomingEvents(), fetchMyReviews()]);
  }, [fetchFollowingCount, fetchUpcomingEvents, fetchMyReviews]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    if (fetchProfile) await fetchProfile();
    setRefreshing(false);
  };

  const defaultCover = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';
  const displayCoverUrl = profile?.cover_url || defaultCover;
  
  const displayName = profile?.display_name ?? appUser?.email ?? 'Fan';

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 140 }}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22D3EE" />
        }
      >
        {/* ── Cover card — bento style matching ArtistProfile ── */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.coverWrap}>
          <Image source={{ uri: displayCoverUrl }} style={styles.coverImg} contentFit="cover" />
          <LinearGradient colors={['rgba(5,10,24,0.1)', 'rgba(5,10,24,0.55)']} style={StyleSheet.absoluteFill} />

          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={() => navigate('public-home')}>
            <ChevronLeft size={24} color="#ffffff" />
          </Button>

          <View style={styles.headerRight}>
            <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => navigate('edit-profile')}>
              <Pencil size={20} color="#ffffff" />
            </Button>
            <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={async () => { await signOut(); navigate('public-home'); }}>
              <LogOut size={20} color="#FF3B30" />
            </Button>
            <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => {}}>
              <Share2 size={24} color="#ffffff" />
            </Button>
          </View>
        </Animated.View>

        {/* ── Profile section ── */}
        <Animated.View entering={SlideInDown.duration(600).springify()} style={styles.profileContainer}>
          {/* Avatar — centered, large, with fan badge */}
          <Pressable style={styles.profileImgContainer} disabled>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.profileImg} contentFit="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={44} color="rgba(255,255,255,0.4)" />
              </View>
            )}
            <View style={styles.fanBadge}>
              <Star size={10} color="#000" fill="#000" />
            </View>
          </Pressable>

          {/* Name + meta — centered */}
          <View style={styles.profileHeader}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
            </Animated.View>

            {profile?.username ? (
              <View style={styles.usernameWrap}>
                <Badge style={styles.usernamePill}>@{profile.username}</Badge>
              </View>
            ) : null}

            {profile?.city ? (
              <View style={styles.meta}>
                <MapPin size={16} color="#8E8E93" />
                <Text style={styles.metaText}>{profile.city}</Text>
              </View>
            ) : null}

            <Badge style={styles.roleBadge}>Fan</Badge>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{followingCount}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{upcomingEvents.length}</Text>
              <Text style={styles.statLabel}>Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{myReviews.length}</Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
          </View>

          {/* Tabs */}
          <Tabs
            defaultValue="events"
            fullWidth
            tabs={[
              { value: 'events', label: 'My Tickets' },
              { value: 'reviews', label: 'My Reviews' },
            ]}
          >
            {(tab) => tab === 'events' ? (
              <Animated.View entering={FadeIn.duration(400)} style={styles.tabContent}>
                {loadingEvents ? (
                  <ActivityIndicator color="#22D3EE" style={{ marginTop: 40 }} />
                ) : upcomingEvents.length > 0 ? (
                  upcomingEvents.map((item) => (
                    <TouchableOpacity
                      key={item.ticket_id}
                      style={styles.card}
                      activeOpacity={0.82}
                      onPress={() => navigate('event-details', { selectedEvent: item.events, eventId: item.events?.event_id })}
                    >
                      {item.events?.poster_url ? (
                        <Image source={{ uri: item.events.poster_url }} style={styles.eventPoster} contentFit="cover" />
                      ) : (
                        <View style={[styles.eventPoster, styles.posterPlaceholder]}>
                          <CalendarDays size={24} color="rgba(255,255,255,0.15)" />
                        </View>
                      )}
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle} numberOfLines={1}>{item.events?.title}</Text>
                        <View style={styles.cardRow}>
                          <CalendarDays size={12} color="#8E8E93" />
                          <Text style={styles.cardMeta}>{item.events ? formatDate(item.events.event_date) : ''}</Text>
                        </View>
                        <View style={styles.ticketPill}>
                          <Ticket size={10} color="#22D3EE" />
                          <Text style={styles.ticketPillText}>{item.quantity} ticket{item.quantity !== 1 ? 's' : ''}</Text>
                        </View>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyBento}>
                    <View style={styles.emptyIconCircle}>
                      <Ticket size={36} color="#FDF2FF" />
                    </View>
                    <Text style={styles.emptyTitle}>No tickets yet</Text>
                    <Text style={styles.emptyDesc}>Discover events and book your spot to see them here.</Text>
                    <Button variant="outline" size="sm" onPress={() => navigate('events-grid')} style={{ marginTop: 16 }}>
                      Find Events
                    </Button>
                  </View>
                )}
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(400)} style={styles.tabContent}>
                {loadingReviews ? (
                  <ActivityIndicator color="#FBBF24" style={{ marginTop: 40 }} />
                ) : myReviews.length > 0 ? (
                  myReviews.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.card}
                      activeOpacity={0.82}
                      onPress={() => navigate('artist-profile', { selectedArtist: { user_id: item.artist_id, ...item.artist_profile } })}
                    >
                      {item.artist_profile?.avatar_url ? (
                        <Image source={{ uri: item.artist_profile.avatar_url }} style={styles.reviewAvatar} contentFit="cover" />
                      ) : (
                        <View style={[styles.reviewAvatar, styles.posterPlaceholder]}>
                          <User size={18} color="rgba(255,255,255,0.2)" />
                        </View>
                      )}
                      <View style={styles.cardBody}>
                        <Text style={styles.cardTitle}>{item.artist_profile?.display_name ?? 'Artist'}</Text>
                        <StarRating rating={item.rating} />
                        <Text style={styles.reviewComment} numberOfLines={2}>{item.comment}</Text>
                      </View>
                      <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.emptyBento}>
                    <View style={styles.emptyIconCircle}>
                      <Star size={36} color="#FDF2FF" />
                    </View>
                    <Text style={styles.emptyTitle}>No reviews yet</Text>
                    <Text style={styles.emptyDesc}>Share your feedback after attending an artist's event.</Text>
                    <Button variant="outline" size="sm" onPress={() => navigate('search-discover')} style={{ marginTop: 16 }}>
                      Find Artists
                    </Button>
                  </View>
                )}
              </Animated.View>
            )}
          </Tabs>
        </Animated.View>
      </ScrollView>
      <BottomNav activeTab="profile" navigate={navigate} userRole="public" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },

  // ── Cover: bento card matching ArtistProfile ──
  coverWrap: { height: 320, backgroundColor: '#0d141d', borderRadius: 40, marginHorizontal: 16, marginTop: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  coverImg: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 32, left: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8, zIndex: 50, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  headerRight: { position: 'absolute', top: 32, right: 16, flexDirection: 'row', gap: 12, zIndex: 50 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },

  // ── Profile section ──
  profileContainer: { paddingHorizontal: 16, marginTop: -40, zIndex: 10 },
  profileImgContainer: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, borderWidth: 6, borderColor: '#050A18', backgroundColor: '#0d141d', zIndex: 10 },
  profileImg: { width: '100%', height: '100%', borderRadius: 60 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  fanBadge: { position: 'absolute', bottom: 2, right: 2, width: 24, height: 24, borderRadius: 12, backgroundColor: '#22D3EE', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#050A18' },

  profileHeader: { alignItems: 'center', marginTop: 16, marginBottom: 24, paddingHorizontal: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontSize: 44, fontWeight: '800', color: '#ffffff', letterSpacing: -1.5 },
  roleBadge: { backgroundColor: 'rgba(34,211,238,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(34,211,238,0.3)', marginTop: 8 },
  usernameWrap: { width: '100%', alignItems: 'center', marginBottom: 8 },
  usernamePill: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  metaText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },

  // ── Stats ──
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 80, paddingVertical: 32, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 40, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  statLabel: { color: '#8E8E93', fontSize: 12, marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Tab content ──
  tabContent: { marginTop: 16, gap: 16 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 40, padding: 20, overflow: 'hidden' },
  eventPoster: { width: 72, height: 72, borderRadius: 20 },
  reviewAvatar: { width: 72, height: 72, borderRadius: 36 },
  posterPlaceholder: { backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardMeta: { color: '#8E8E93', fontSize: 14, fontWeight: '500' },
  ticketPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(34,211,238,0.1)', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start', marginTop: 2 },
  ticketPillText: { color: '#22D3EE', fontSize: 12, fontWeight: '700' },
  reviewComment: { color: '#8E8E93', fontSize: 14, lineHeight: 20, fontWeight: '500' },

  // ── Empty state ──
  emptyBento: { backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 40, padding: 48, alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.06)', gap: 8, marginTop: 8 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(253,242,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  emptyTitle: { color: '#ffffff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  emptyDesc: { color: '#8E8E93', fontSize: 15, textAlign: 'center', lineHeight: 22, fontWeight: '500' },
});
