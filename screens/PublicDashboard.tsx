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
} from 'react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  MapPin,
  Settings,
  CalendarDays,
  Star,
  Ticket,
  ChevronRight,
  UserCheck,
} from 'lucide-react-native';
import { Text } from '../components/ui/Text';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

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

const TABS = ['Upcoming Events', 'My Reviews'] as const;
type Tab = (typeof TABS)[number];

function StarRating({ rating }: { rating: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          color={i <= rating ? '#FBBF24' : 'rgba(255,255,255,0.2)'}
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
  const { appUser, profile, fetchProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('Upcoming Events');
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

  // ─── Header ───────────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top row: avatar + actions */}
      <View style={styles.headerTop}>
        <View style={styles.avatarWrap}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={44} color="rgba(255,255,255,0.4)" />
            </View>
          )}
          {/* Fan badge */}
          <View style={styles.fanBadge}>
            <Star size={10} color="#fff" fill="#fff" />
          </View>
        </View>

        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => navigate('edit-profile')}
          activeOpacity={0.75}
        >
          <Settings size={18} color="rgba(255,255,255,0.85)" />
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Name & username */}
      <Text style={styles.displayName} numberOfLines={1}>
        {profile?.display_name ?? appUser?.email ?? 'Fan'}
      </Text>
      {profile?.username ? (
        <Text style={styles.username}>@{profile.username}</Text>
      ) : null}

      {/* City */}
      {profile?.city ? (
        <View style={styles.cityRow}>
          <MapPin size={13} color="#64748b" />
          <Text style={styles.cityText}>{profile.city}</Text>
        </View>
      ) : null}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <UserCheck size={16} color="#22D3EE" />
          <Text style={styles.statValue}>{followingCount}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ticket size={16} color="#A78BFA" />
          <Text style={styles.statValue}>{upcomingEvents.length}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Star size={16} color="#FBBF24" />
          <Text style={styles.statValue}>{myReviews.length}</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── Upcoming Events ──────────────────────────────────────────────────────
  const renderEventItem = ({ item }: { item: UpcomingEvent }) => {
    const ev = item.events;
    if (!ev) return null;
    const venue = [ev.location_name, ev.city].filter(Boolean).join(' · ');
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() => navigate('event-details', { selectedEvent: ev, eventId: ev.event_id })}
      >
        {ev.poster_url ? (
          <Image source={{ uri: ev.poster_url }} style={styles.eventPoster} contentFit="cover" />
        ) : (
          <View style={[styles.eventPoster, styles.posterPlaceholder]}>
            <CalendarDays size={32} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={2}>{ev.title}</Text>
          <View style={styles.cardRow}>
            <CalendarDays size={13} color="#94a3b8" />
            <Text style={styles.cardMeta}>{formatDate(ev.event_date)}</Text>
          </View>
          {venue ? (
            <View style={styles.cardRow}>
              <MapPin size={13} color="#94a3b8" />
              <Text style={styles.cardMeta} numberOfLines={1}>{venue}</Text>
            </View>
          ) : null}
          <View style={styles.ticketPill}>
            <Ticket size={11} color="#A78BFA" />
            <Text style={styles.ticketPillText}>{item.quantity} ticket{item.quantity !== 1 ? 's' : ''}</Text>
          </View>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.25)" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  // ─── Reviews ──────────────────────────────────────────────────────────────
  const renderReviewItem = ({ item }: { item: MyReview }) => {
    const ap = item.artist_profile;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.82}
        onPress={() =>
          navigate('artist-profile', {
            selectedArtist: { user_id: item.artist_id, ...ap },
          })
        }
      >
        {ap?.avatar_url ? (
          <Image source={{ uri: ap.avatar_url }} style={styles.reviewAvatar} contentFit="cover" />
        ) : (
          <View style={[styles.reviewAvatar, styles.posterPlaceholder]}>
            <User size={22} color="rgba(255,255,255,0.2)" />
          </View>
        )}
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {ap?.display_name ?? 'Artist'}
          </Text>
          {ap?.username ? (
            <Text style={styles.usernameSmall}>@{ap.username}</Text>
          ) : null}
          <StarRating rating={item.rating} />
          <Text style={styles.reviewComment} numberOfLines={2}>
            {item.comment}
          </Text>
          <Text style={styles.reviewDate}>{formatDate(item.created_at)}</Text>
        </View>
        <ChevronRight size={18} color="rgba(255,255,255,0.25)" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  // ─── Tab Content ──────────────────────────────────────────────────────────
  const renderTabContent = () => {
    if (activeTab === 'Upcoming Events') {
      if (loadingEvents) {
        return <ActivityIndicator color="#A78BFA" style={{ marginTop: 40 }} />;
      }
      if (upcomingEvents.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Ticket size={48} color="rgba(167,139,250,0.3)" />
            <Text style={styles.emptyTitle}>No upcoming events</Text>
            <Text style={styles.emptySubtitle}>Book tickets from the Events tab to see them here</Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => navigate('events-grid')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>Browse Events</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <FlatList
          data={upcomingEvents}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.ticket_id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      );
    }

    if (activeTab === 'My Reviews') {
      if (loadingReviews) {
        return <ActivityIndicator color="#FBBF24" style={{ marginTop: 40 }} />;
      }
      if (myReviews.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Star size={48} color="rgba(251,191,36,0.3)" />
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptySubtitle}>
              Visit an artist's profile to leave a review after attending their event
            </Text>
            <TouchableOpacity
              style={styles.emptyAction}
              onPress={() => navigate('search-discover')}
              activeOpacity={0.8}
            >
              <Text style={styles.emptyActionText}>Discover Artists</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <FlatList
          data={myReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />
        }
      >
        {renderHeader()}
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          {renderTabContent()}
        </View>
      </ScrollView>
      <BottomNav activeTab="profile" navigate={navigate} userRole="public" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
    borderColor: '#22D3EE',
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#050A18',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editBtnText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    fontWeight: '600',
  },
  displayName: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  username: {
    color: '#94a3b8',
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 8,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  cityText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginBottom: 20,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 4,
    gap: 4,
    marginBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(34,211,238,0.15)',
  },
  tabBtnText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#22D3EE',
    fontWeight: '700',
  },

  // Cards
  listContent: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  eventPoster: {
    width: 72,
    height: 72,
    borderRadius: 12,
    flexShrink: 0,
  },
  posterPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    flexShrink: 0,
  },
  cardBody: { flex: 1, gap: 5 },
  cardTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMeta: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  ticketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(167,139,250,0.12)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  ticketPillText: {
    color: '#A78BFA',
    fontSize: 12,
    fontWeight: '700',
  },
  usernameSmall: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  reviewComment: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: 2,
  },
  reviewDate: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
  },

  // Empty states
  emptyState: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  emptySubtitle: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 16,
    backgroundColor: 'rgba(34,211,238,0.12)',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,211,238,0.3)',
  },
  emptyActionText: {
    color: '#22D3EE',
    fontSize: 15,
    fontWeight: '700',
  },
});
