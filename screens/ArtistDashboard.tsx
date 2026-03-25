import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, Modal, Pressable, Alert } from 'react-native';
import React, { useEffect, useState, useMemo } from 'react';
import Svg, { Circle } from 'react-native-svg';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Settings, Sparkles, Clock, AlertCircle, RefreshCw, MessageSquare, Star, CalendarDays, X, Trophy } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

// Analytics Imports
import { useArtistAnalytics, AnalyticsPeriod } from '../hooks/useArtistAnalytics';
import { MetricCard } from '../components/analytics/MetricCard';
import { TrendLineChart } from '../components/analytics/TrendLineChart';
import { HeatmapGrid } from '../components/analytics/HeatmapGrid';
import { ActivityBubbleMap } from '../components/analytics/ActivityBubbleMap';
import { FunnelChart } from '../components/analytics/FunnelChart';
import { ContentPerformanceTable } from '../components/analytics/ContentPerformanceTable';
import { BenchmarkGauge } from '../components/analytics/BenchmarkGauge';
import { AIInsightCard } from '../components/analytics/AIInsightCard';
import { AnomalyBanner } from '../components/analytics/AnomalyBanner';
import { ReachSplitCard } from '../components/analytics/ReachSplitCard';
import { FollowAttributionCard } from '../components/analytics/FollowAttributionCard';
import { AudienceDemographicsCard } from '../components/analytics/AudienceDemographicsCard';
import { RetentionCurveChart } from '../components/analytics/RetentionCurveChart';

interface Props {
  navigate: (screen: string, data?: any) => void;
}

const HOURS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function ArtistDashboard({ navigate }: Props) {
  const { profile, appUser } = useAuth();
  const displayName = profile?.display_name ?? appUser?.email?.split('@')[0] ?? 'Artist';
  const isBoosted = profile?.is_boosted ?? false;
  const boostExpiryMs = profile?.boost_expiry ? new Date(profile.boost_expiry).getTime() : null;
  const isBoostActive =
    isBoosted && (boostExpiryMs == null || Number.isNaN(boostExpiryMs) || boostExpiryMs > Date.now());
  const boostExpiryDate = profile?.boost_expiry ? new Date(profile.boost_expiry) : null;
  const boostRemainingText = (() => {
    if (!boostExpiryDate || Number.isNaN(boostExpiryDate.getTime())) return null;
    const remainingMs = boostExpiryDate.getTime() - Date.now();
    if (remainingMs <= 0) return 'Expired';
    const days = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
    if (days <= 1) return 'Less than a day';
    return `${days} days left`;
  })();

  const [boostProgressPct, setBoostProgressPct] = useState<number | null>(null);
  useEffect(() => {
    const run = async () => {
      if (!appUser?.id || !isBoostActive) {
        setBoostProgressPct(null);
        return;
      }

      const { data, error } = await supabase
        .from('boost_requests')
        .select('duration_days, resolved_at')
        .eq('artist_id', appUser.id)
        .eq('status', 'approved')
        .order('resolved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data?.resolved_at || !data?.duration_days) {
        setBoostProgressPct(null);
        return;
      }

      const startMs = new Date(data.resolved_at).getTime();
      const expiryMs = profile?.boost_expiry ? new Date(profile.boost_expiry).getTime() : null;
      const endMs = expiryMs ?? startMs + Number(data.duration_days) * 24 * 60 * 60 * 1000;
      const durationMs = Math.max(endMs - startMs, 1);
      const rawPct = (Date.now() - startMs) / durationMs;
      const clamped = Math.max(0, Math.min(1, rawPct));
      setBoostProgressPct(clamped);
    };

    run();
  }, [appUser?.id, isBoostActive, profile?.boost_expiry]);
  const [recentReview, setRecentReview] = useState<any | null>(null);
  const [recentMessageRequest, setRecentMessageRequest] = useState<any | null>(null);
  const [recentMessageRequests, setRecentMessageRequests] = useState<any[]>([]);
  const [recentEvent, setRecentEvent] = useState<any | null>(null);
  const [lineupInvites, setLineupInvites] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [contestNotifications, setContestNotifications] = useState<any[]>([]);
  const [unreadContestNotificationsCount, setUnreadContestNotificationsCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [inviteActionLoadingId, setInviteActionLoadingId] = useState<string | null>(null);

  const formatRelativeTime = (iso: string | null | undefined) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diffMs = Date.now() - t;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    const fetchActivity = async () => {
      if (!appUser?.id) return;
      setLoadingActivity(true);
      try {
        // Latest review on this artist
        const { data: reviewData } = await supabase
          .from('artist_reviews')
          .select('*')
          .eq('artist_id', appUser.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setRecentReview(reviewData || null);

        // Latest pending message request to this artist
        const { data: reqData } = await supabase
          .from('message_requests')
          .select('*')
          .eq('receiver_id', appUser.id)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setRecentMessageRequest(reqData || null);

        // Recent message requests with sender info
        const { data: reqListData } = await supabase
          .from('message_requests')
          .select('id, sender_id, status, created_at')
          .eq('receiver_id', appUser.id)
          .order('created_at', { ascending: false })
          .limit(8);
        const safeReqList = reqListData || [];
        if (safeReqList.length > 0) {
          const senderIds = Array.from(new Set(safeReqList.map((r: any) => r.sender_id).filter(Boolean)));
          const { data: senderProfiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, username, avatar_url')
            .in('user_id', senderIds);
          const senderMap = (senderProfiles || []).reduce((acc: Record<string, any>, p: any) => {
            acc[p.user_id] = p;
            return acc;
          }, {});
          setRecentMessageRequests(
            safeReqList.map((r: any) => ({
              ...r,
              sender: senderMap[r.sender_id] || null,
            }))
          );
        } else {
          setRecentMessageRequests([]);
        }

        // Latest upcoming booking/event for this artist
        const { data: bookingData } = await supabase
          .from('bookings')
          .select('*')
          .eq('artist_id', appUser.id)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(1)
          .maybeSingle();
        setRecentEvent(bookingData || null);

        // Recent contest winner notifications
        try {
          const { data: notifListData, error: notifListErr } = await supabase
            .from('user_notifications')
            .select('notification_id, notification_type, message, created_at, is_read')
            .eq('user_id', appUser.id)
            .order('created_at', { ascending: false })
            .limit(8);

          if (!notifListErr) {
            setContestNotifications(notifListData || []);
          }

          const { count: unreadCount, error: unreadCountErr } = await supabase
            .from('user_notifications')
            .select('notification_id', { count: 'exact', head: true })
            .eq('user_id', appUser.id)
            .eq('is_read', false);

          if (!unreadCountErr) {
            setUnreadContestNotificationsCount(unreadCount ?? 0);
          }
        } catch (e) {
          console.error('Failed to load contest notifications:', e);
          setContestNotifications([]);
          setUnreadContestNotificationsCount(0);
        }

        // Recent lineup invites for this artist from events.lineup_artists
        const { data: eventsData } = await supabase
          .from('events')
          .select('event_id, title, event_date, location_name, city, lineup_artists, is_deleted')
          .eq('is_deleted', false)
          .gte('event_date', new Date().toISOString())
          .order('event_date', { ascending: true })
          .limit(60);

        const invites = (eventsData || []).flatMap((ev: any) => {
          const lineup = Array.isArray(ev.lineup_artists)
            ? ev.lineup_artists
            : (() => {
                try {
                  return JSON.parse(ev.lineup_artists || '[]');
                } catch {
                  return [];
                }
              })();
          const match = (lineup || []).find((item: any) => item?.user_id === appUser.id);
          if (!match || match?.invite_status !== 'pending') return [];
          return [{
            id: `lineup-${ev.event_id}-${appUser.id}`,
            event_id: ev.event_id,
            title: ev.title,
            event_date: ev.event_date,
            location_name: ev.location_name,
            city: ev.city,
            invited_at: match?.invited_at || ev.event_date,
          }];
        });
        setLineupInvites(invites.slice(0, 8));
      } catch (e) {
        console.error('Error fetching dashboard activity:', e);
        setRecentReview(null);
        setRecentMessageRequest(null);
        setRecentMessageRequests([]);
        setRecentEvent(null);
        setLineupInvites([]);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [appUser?.id]);

  // Mark contest winner notifications as read when the sheet opens.
  useEffect(() => {
    if (!showNotifications) return;
    if (!appUser?.id) return;

    const run = async () => {
      try {
        await supabase
          .from('user_notifications')
          .update({ is_read: true })
          .eq('user_id', appUser.id)
          .eq('is_read', false);
        setUnreadContestNotificationsCount(0);
      } catch (e) {
        console.error('Failed to mark notifications as read:', e);
      }
    };

    run();
  }, [showNotifications, appUser?.id]);

  const {
    isLoading, error, period, setPeriod, refresh, reachTrend, dailyTrend, heatmap, geo, funnel,
    contentPerformance, benchmarks, anomalies, repeatViewerRate, churnRiskCount,
    followerReachSplit, followAttribution, audienceDemographics, avgRetentionCurve
  } = useArtistAnalytics(appUser?.id || '');

  // Calculate Engagement Rate across 30d
  const totalViews = useMemo(() => dailyTrend?.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0) || 0, [dailyTrend]);
  const totalEngagements = useMemo(() => dailyTrend?.reduce((acc: number, curr: any) => acc + (curr.likes || 0) + (curr.shares || 0) + (curr.follows || 0), 0) || 0, [dailyTrend]);
  const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0;
  
  // Calculate Conversion Rate
  const discoveryCount = funnel?.find(f => f.step_order === 1)?.user_count || 0;
  const bookingCount = funnel?.find(f => f.step_order === 5)?.user_count || 0;
  const conversionRate = discoveryCount > 0 ? (bookingCount / discoveryCount) * 100 : 0;

  // Formatting chart data
  const trendSeriesData = useMemo(() => {
    if (!dailyTrend) return [];
    
    const views = dailyTrend.map(d => ({ day: new Date(d.day), value: Number(d.views) }));
    const follows = dailyTrend.map(d => ({ day: new Date(d.day), value: Number(d.follows) }));
    const profileViews = dailyTrend.map(d => ({ day: new Date(d.day), value: Number(d.profile_views) }));
    return [views, follows, profileViews];
  }, [dailyTrend]);

  const bestPostTime = useMemo(() => {
    if (!heatmap || heatmap.length === 0) return null;
    const max = heatmap.reduce((prev, curr) => (curr.avg_events > prev.avg_events ? curr : prev), heatmap[0]);
    if (!max || max.avg_events === 0) return null;
    return `${DAYS[max.dow]} at ${HOURS[max.hour]}`;
  }, [heatmap]);

  const repeatBuckets = useMemo(() => {
    if (!repeatViewerRate || repeatViewerRate.length === 0) return { "1 view": 0, "2–4 views": 0, "5+ views": 0, total: 0 };
    let total = 0;
    const map: any = { "1 view": 0, "2–4 views": 0, "5+ views": 0 };
    repeatViewerRate.forEach(b => {
      map[b.bucket] = b.viewer_count;
      total += Number(b.viewer_count);
    });
    map.total = Math.max(total, 1);
    return map;
  }, [repeatViewerRate]);

  const unreadActivityCount = useMemo(() => {
    const pendingReqCount = recentMessageRequests.filter((item: any) => item.status === 'pending').length;
    return pendingReqCount + lineupInvites.length + unreadContestNotificationsCount;
  }, [recentMessageRequests, lineupInvites, unreadContestNotificationsCount]);

  const handleLineupInviteDecision = async (invite: any, decision: 'accept' | 'reject') => {
    if (!appUser?.id || !invite?.event_id) return;
    setInviteActionLoadingId(invite.id);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('event_id, title, event_date, location_name, city, lineup_artists')
        .eq('event_id', invite.event_id)
        .maybeSingle();
      if (eventError) throw eventError;
      if (!eventData) throw new Error('Event not found');

      const lineup = Array.isArray((eventData as any).lineup_artists)
        ? (eventData as any).lineup_artists
        : (() => {
            try {
              return JSON.parse((eventData as any).lineup_artists || '[]');
            } catch {
              return [];
            }
          })();

      const nextLineup = (lineup || [])
        .map((item: any) => {
          if (item?.user_id !== appUser.id) return item;
          if (decision === 'reject') return null;
          return { ...item, invite_status: 'accepted', accepted_at: new Date().toISOString() };
        })
        .filter(Boolean);

      const { error: updateError } = await supabase
        .from('events')
        .update({ lineup_artists: nextLineup })
        .eq('event_id', invite.event_id);
      if (updateError) throw updateError;

      if (decision === 'accept') {
        const eventDate = new Date((eventData as any).event_date);
        const scheduleDate = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
        const startTime = `${String(eventDate.getHours()).padStart(2, '0')}:${String(eventDate.getMinutes()).padStart(2, '0')}:00`;
        const scheduleTitle = (eventData as any).title || 'Event';
        const venue = [(eventData as any).location_name, (eventData as any).city].filter(Boolean).join(', ') || null;

        const { data: existingSchedule } = await supabase
          .from('artist_schedule')
          .select('schedule_id')
          .eq('artist_id', appUser.id)
          .eq('schedule_date', scheduleDate)
          .eq('title', scheduleTitle)
          .limit(1);

        if (!existingSchedule || existingSchedule.length === 0) {
          const { error: scheduleError } = await supabase.from('artist_schedule').insert({
            artist_id: appUser.id,
            schedule_date: scheduleDate,
            title: scheduleTitle,
            notes: 'Added from event lineup invite',
            start_time: startTime,
            duration_minutes: null,
            venue,
            location_address: null,
          });
          if (scheduleError) throw scheduleError;
        }
      }

      setLineupInvites((prev) => prev.filter((x) => x.id !== invite.id));
      Alert.alert('Updated', decision === 'accept' ? 'Event invite accepted and added to your schedule.' : 'Event invite rejected.');
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update event invite.');
    } finally {
      setInviteActionLoadingId(null);
    }
  };

  if (isLoading && !dailyTrend) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <LinearGradient colors={['#050A14', '#0C1120']} style={StyleSheet.absoluteFill} />
        <View style={styles.loadingSpinnerRing}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
        <Text style={styles.loadingTitle}>Building your report</Text>
        <Text style={styles.loadingSubtitle}>Crunching the numbers...</Text>
        <BottomNav activeTab="home" navigate={navigate} userRole="artist" isAuthenticated />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}>
        <LinearGradient colors={['#0A0F1E', '#0A0F1E']} style={StyleSheet.absoluteFill} />
        <AlertCircle size={48} color="#F43F5E" />
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Failed to load analytics</Text>
        <Text style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', paddingHorizontal: 32 }}>{error}</Text>
        <Button onPress={refresh} style={{ backgroundColor: '#6366F1', marginTop: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Retry</Text>
        </Button>
        <BottomNav activeTab="home" navigate={navigate} userRole="artist" isAuthenticated />
      </View>
    );
  }

  const SectionTitle = ({ label, accentColor = '#6366F1' }: { label: string; accentColor?: string }) => (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionAccent, { backgroundColor: accentColor }]} />
      <Text style={styles.sectionTitle}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A14', '#0C1120']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.eyebrow}>Analytics</Text>
            <Text style={styles.title}>{displayName}</Text>
            <Text style={styles.subtitle}>Here's how your profile is performing</Text>
          </View>
          <View style={styles.headerBtns}>
            {isLoading && <ActivityIndicator size="small" color="#6366F1" />}
            <Button variant="ghost" size="icon" onPress={refresh}><RefreshCw size={18} color="rgba(255,255,255,0.5)" /></Button>
            <Button variant="ghost" size="icon" onPress={() => setShowNotifications(true)} style={styles.bellBtn}>
              <Bell size={20} color="rgba(255,255,255,0.5)" />
              {unreadActivityCount > 0 && (
                <View style={styles.bellBadge}>
                  <Text style={styles.bellBadgeText}>{unreadActivityCount > 9 ? '9+' : unreadActivityCount}</Text>
                </View>
              )}
            </Button>
            <Button variant="ghost" size="icon"><Settings size={20} color="rgba(255,255,255,0.5)" /></Button>
          </View>
        </View>

        {isBoostActive ? (
          <Card style={styles.boostActiveCard}>
            <View style={styles.boostActiveRow}>
              <View style={styles.boostActiveIcon}>
                {boostProgressPct == null ? (
                  <Sparkles size={16} color="#fff" />
                ) : (
                  <View style={styles.boostProgressWrap}>
                    <Svg width={36} height={36} viewBox="0 0 36 36">
                      <Circle
                        cx={18}
                        cy={18}
                        r={14}
                        stroke="rgba(255,255,255,0.18)"
                        strokeWidth={3}
                        fill="none"
                      />
                      <Circle
                        cx={18}
                        cy={18}
                        r={14}
                        stroke="#22D3EE"
                        strokeWidth={3}
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 14}
                        // Show remaining time: as time passes, the ring shrinks.
                        strokeDashoffset={boostProgressPct * 2 * Math.PI * 14}
                        transform="rotate(-90 18 18)"
                      />
                    </Svg>
                    <View style={styles.boostProgressCenter}>
                      <Sparkles size={15} color="#fff" />
                    </View>
                  </View>
                )}
              </View>
              <View style={styles.boostActiveTextWrap}>
                <Text style={styles.boostActiveTitle}>Boost Active</Text>
                <Text style={styles.boostActiveSub}>
                  {boostExpiryDate && boostRemainingText
                    ? `${boostRemainingText} • Expires ${boostExpiryDate.toLocaleDateString()}`
                    : 'Your profile is currently boosted.'}
                </Text>
              </View>
            </View>
          </Card>
        ) : (
          <Card style={styles.boostCtaCard}>
            <View style={styles.boostCtaRow}>
              <View style={styles.boostCtaTextWrap}>
                <Text style={styles.boostCtaTitle}>Boost your profile</Text>
                <Text style={styles.boostCtaDesc}>
                  Get featured visibility and attract more organizer requests.
                </Text>
              </View>
              <Button style={styles.boostCtaBtn} onPress={() => navigate('purchase-boost')}>
                <Sparkles size={16} color="#162447" />
                <Text style={styles.boostCtaBtnText}>Boost</Text>
              </Button>
            </View>
          </Card>
        )}

        {anomalies && anomalies.length > 0 && (
          <AnomalyBanner anomalies={anomalies} />
        )}

        <SectionTitle label="Overview" />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricsRow}>
          <MetricCard index={0} label="Accounts Reached" value={Number(reachTrend?.current_reach || 0)} previousValue={reachTrend?.previous_reach != null ? Number(reachTrend.previous_reach) : undefined} />
          <MetricCard index={1} label="Total Views" value={totalViews} />
          <MetricCard index={2} label="Engagement Rate" value={engagementRate} format="percent" />
          <MetricCard index={3} label="Booking Conv." value={conversionRate} format="percent" />
        </ScrollView>

        {followerReachSplit && followerReachSplit.total_reach > 0 && (
          <ReachSplitCard
            followerReach={Number(followerReachSplit.follower_reach)}
            nonFollowerReach={Number(followerReachSplit.non_follower_reach)}
            totalReach={Number(followerReachSplit.total_reach)}
          />
        )}

        <SectionTitle label="AI Insights" accentColor="#A78BFA" />
        <AIInsightCard artistId={appUser?.id || ''} metrics={{ ...reachTrend, totalViews, engagementRate, conversionRate }} />

        <SectionTitle label="Activity Trend" />
        <View style={styles.chartCard}>
          <View style={styles.periodSelector}>
            {[7, 30, 60, 90].map((p) => (
              <TouchableOpacity key={p} onPress={() => setPeriod(p as AnalyticsPeriod)} style={[styles.periodPill, period === p && styles.periodPillActive]}>
                <Text style={[styles.periodPillText, period === p && { color: '#fff' }]}>{p}d</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TrendLineChart loading={isLoading} data={trendSeriesData} series={[
            { label: 'Views', color: '#6366F1' },
            { label: 'Follows', color: '#10B981' },
            { label: 'Profile', color: '#F59E0B' },
          ]} />
        </View>

        <SectionTitle label="Peak Activity Times" accentColor="#F59E0B" />
        <Card style={styles.cardPad}>
          <HeatmapGrid data={heatmap || []} />
          {bestPostTime && (
            <View style={styles.bestTimePill}>
              <Clock size={14} color="#6366F1" />
              <Text style={styles.bestTimeText}>Best time to post: <Text style={{ color: '#fff', fontWeight: '700' }}>{bestPostTime}</Text></Text>
            </View>
          )}
        </Card>

        <SectionTitle label="Geographic Reach" accentColor="#06B6D4" />
        <Card style={styles.cardPad}>
          <ActivityBubbleMap cities={geo || []} />
        </Card>

        {audienceDemographics && audienceDemographics.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <AudienceDemographicsCard
              ageData={audienceDemographics.filter((d: any) => d.dimension === 'age_range').map((d: any) => ({ value: d.value, count: Number(d.count), pct: Number(d.pct) }))}
              genderData={audienceDemographics.filter((d: any) => d.dimension === 'gender').map((d: any) => ({ value: d.value, count: Number(d.count), pct: Number(d.pct) }))}
            />
          </View>
        )}

        <SectionTitle label="Audience Loyalty" accentColor="#10B981" />
        <Card style={styles.cardPad}>
          <View style={styles.loyaltyStripData}>
            <Text style={styles.loyaltyStat}>Once  {Math.round((repeatBuckets["1 view"] / repeatBuckets.total) * 100)}%</Text>
            <Text style={styles.loyaltyStat}>2–4×  {Math.round((repeatBuckets["2–4 views"] / repeatBuckets.total) * 100)}%</Text>
            <Text style={styles.loyaltyStat}>5+  {Math.round((repeatBuckets["5+ views"] / repeatBuckets.total) * 100)}%</Text>
          </View>
          <View style={styles.loyaltyBarContainer}>
            <View style={[styles.loyaltyBar, { flex: Math.max(repeatBuckets["1 view"], 0.1), backgroundColor: 'rgba(99,102,241,0.25)' }]} />
            <View style={[styles.loyaltyBar, { flex: Math.max(repeatBuckets["2–4 views"], 0.1), backgroundColor: 'rgba(99,102,241,0.6)' }]} />
            <View style={[styles.loyaltyBar, { flex: Math.max(repeatBuckets["5+ views"], 0.1), backgroundColor: '#6366F1' }]} />
          </View>
        </Card>

        <SectionTitle label="Audience Funnel" accentColor="#A855F7" />
        <Card style={styles.cardPad}>
          <FunnelChart steps={(funnel || []).map((f: any) => ({ label: f.step, count: Number(f.user_count), dropOffPct: Number(f.drop_off_pct) }))} />
        </Card>

        {avgRetentionCurve && avgRetentionCurve.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <RetentionCurveChart data={avgRetentionCurve.map((r: any) => ({ checkpoint: r.checkpoint, avg_retention: r.avg_retention }))} />
          </View>
        )}

        {followAttribution && followAttribution.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <FollowAttributionCard data={followAttribution} />
          </View>
        )}

        <SectionTitle label="Top Content" accentColor="#F59E0B" />
        <ContentPerformanceTable data={contentPerformance || []} />

        <SectionTitle label="How You Compare" accentColor="#10B981" />
        <Card style={styles.cardPad}>
          <BenchmarkGauge
            metricLabel="Engagement Rate"
            artistValue={Number(benchmarks?.engagement_rate?.artist_value || 0)}
            p25={Number(benchmarks?.engagement_rate?.p25 || 0)}
            p50={Number(benchmarks?.engagement_rate?.p50 || 0)}
            p75={Number(benchmarks?.engagement_rate?.p75 || 0)}
            p90={Number(benchmarks?.engagement_rate?.p90 || 0)}
          />
          {benchmarks?.engagement_rate?.percentile && (
            <Text style={styles.benchmarkSummaryText}>You're in the top {100 - benchmarks.engagement_rate.percentile}% of artists for engagement.</Text>
          )}
        </Card>

        {churnRiskCount != null && churnRiskCount > 0 && (
          <Card style={[styles.cardPad, { marginTop: 24, backgroundColor: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.18)' }]}>
            <View style={[styles.sectionRow, { marginTop: 0, marginBottom: 10 }]}>
              <View style={[styles.sectionAccent, { backgroundColor: '#F43F5E' }]} />
              <Text style={[styles.sectionTitle, { color: '#F43F5E' }]}>At-Risk Audience</Text>
            </View>
            <Text style={styles.loyaltyStat}>{churnRiskCount.toLocaleString()} followers haven't engaged in 60 days.</Text>
            <Text style={[styles.loyaltyStat, { fontSize: 13, marginTop: 6, lineHeight: 19 }]}>Post new content or engage in the feed to re-activate them.</Text>
            <Button onPress={() => navigate('upload-video')} style={styles.churnBtn}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create Engagement Post</Text>
            </Button>
          </Card>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={showNotifications} transparent animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
          <Pressable style={styles.notificationsSheet} onPress={() => {}}>
            <View style={styles.notificationsHeader}>
              <Text style={styles.notificationsTitle}>Recent Activity</Text>
              <Button variant="ghost" size="icon" onPress={() => setShowNotifications(false)}>
                <X size={18} color="rgba(255,255,255,0.7)" />
              </Button>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              {loadingActivity ? (
                <ActivityIndicator color="#6366F1" style={{ marginTop: 20 }} />
              ) : (
                <>
                  {contestNotifications.length > 0 &&
                    contestNotifications.map((n: any) => (
                      <View key={n.notification_id || String(n.created_at)} style={styles.activityRow}>
                        <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(34,211,238,0.14)' }]}>
                          <Trophy size={15} color="#22D3EE" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle}>Contest Winner</Text>
                          <Text style={styles.activityMeta}>
                            {n.message} • {formatRelativeTime(n.created_at)}
                          </Text>
                        </View>
                      </View>
                    ))}

                  {lineupInvites.length > 0 && lineupInvites.map((invite: any) => (
                    <View key={invite.id} style={styles.inviteCard}>
                      <View style={styles.activityRowNoBorder}>
                        <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                          <CalendarDays size={15} color="#34D399" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.activityTitle}>Lineup invite: {invite.title}</Text>
                          <Text style={styles.activityMeta}>
                            {new Date(invite.event_date).toLocaleDateString()} • {invite.location_name || invite.city || 'Event venue'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.inviteActions}>
                        <Button
                          variant="outline"
                          size="sm"
                          onPress={() => handleLineupInviteDecision(invite, 'reject')}
                          disabled={inviteActionLoadingId === invite.id}
                          style={styles.rejectBtn}
                        >
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </Button>
                        <Button
                          size="sm"
                          onPress={() => handleLineupInviteDecision(invite, 'accept')}
                          disabled={inviteActionLoadingId === invite.id}
                          style={styles.acceptBtn}
                        >
                          <Text style={styles.acceptBtnText}>
                            {inviteActionLoadingId === invite.id ? 'Saving...' : 'Accept'}
                          </Text>
                        </Button>
                      </View>
                    </View>
                  ))}

                  {recentMessageRequests.length > 0 ? (
                    recentMessageRequests.map((req: any) => {
                      const senderName = req.sender?.display_name || (req.sender?.username ? `@${req.sender.username}` : 'Someone');
                      return (
                        <View key={req.id} style={styles.activityRow}>
                          <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(99,102,241,0.16)' }]}>
                            <MessageSquare size={15} color="#A5B4FC" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.activityTitle}>{senderName} sent a message request</Text>
                            <Text style={styles.activityMeta}>{req.status} • {formatRelativeTime(req.created_at)}</Text>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={styles.emptyActivityText}>No recent message requests.</Text>
                  )}

                  {recentReview && (
                    <View style={styles.activityRow}>
                      <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(250,204,21,0.14)' }]}>
                        <Star size={15} color="#FACC15" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>New review received</Text>
                        <Text style={styles.activityMeta}>{formatRelativeTime(recentReview.created_at)}</Text>
                      </View>
                    </View>
                  )}

                  {recentEvent && (
                    <View style={styles.activityRow}>
                      <View style={[styles.activityIconWrap, { backgroundColor: 'rgba(16,185,129,0.14)' }]}>
                        <CalendarDays size={15} color="#34D399" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.activityTitle}>Upcoming booking on {new Date(recentEvent.event_date).toLocaleDateString()}</Text>
                        <Text style={styles.activityMeta}>{recentEvent.status} • {formatRelativeTime(recentEvent.created_at || recentEvent.event_date)}</Text>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNav activeTab="home" navigate={navigate} userRole="artist" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A14' },
  scroll: { padding: 20, paddingTop: 52, paddingBottom: 100 },

  // Loading state
  loadingSpinnerRing: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(99,102,241,0.1)',
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  loadingTitle: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  loadingSubtitle: { color: 'rgba(255,255,255,0.35)', fontSize: 13 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  headerLeft: { flex: 1 },
  eyebrow: { color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  subtitle: { color: 'rgba(255,255,255,0.4)', marginTop: 3, fontSize: 13 },
  headerBtns: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  bellBtn: { position: 'relative' },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#F43F5E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  boostBadge: { alignSelf: 'flex-start', marginBottom: 20 },
  boostCtaCard: {
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderColor: 'rgba(34,211,238,0.3)',
    marginBottom: 20,
    padding: 14,
  },
  boostActiveCard: {
    backgroundColor: 'rgba(34,211,238,0.09)',
    borderColor: 'rgba(34,211,238,0.45)',
    borderWidth: 1,
    marginBottom: 20,
    padding: 14,
    borderRadius: 22,
  },
  boostActiveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boostActiveIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(34,211,238,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  boostProgressWrap: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  boostProgressCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center', width: 36, height: 36 },
  boostActiveTextWrap: { flex: 1 },
  boostActiveTitle: { color: '#fff', fontWeight: '800', fontSize: 16 },
  boostActiveSub: { color: 'rgba(255,255,255,0.65)', marginTop: 3, fontSize: 12 },
  boostCtaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boostCtaTextWrap: { flex: 1 },
  boostCtaTitle: { color: '#fff', fontWeight: '700', fontSize: 15 },
  boostCtaDesc: { color: 'rgba(255,255,255,0.62)', marginTop: 2, fontSize: 12 },
  boostCtaBtn: { backgroundColor: '#FDF2FF', minHeight: 36, borderRadius: 999, paddingHorizontal: 14 },
  boostCtaBtnText: { color: '#162447', fontWeight: '800', fontSize: 13 },

  // Section titles
  sectionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 36, marginBottom: 16, gap: 10 },
  sectionAccent: { width: 3, height: 18, borderRadius: 2, backgroundColor: '#6366F1' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },

  // Metrics row
  metricsRow: { marginBottom: 20 },

  // Chart section
  chartSection: { marginTop: 4 },
  chartCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20, padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, padding: 4,
    alignSelf: 'flex-start', marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  periodPill: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  periodPillActive: { backgroundColor: '#6366F1' },
  periodPillText: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '700' },

  // Generic card
  cardPad: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
  },

  // Best post time
  bestTimePill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    paddingVertical: 10, paddingHorizontal: 18,
    borderRadius: 24, alignSelf: 'center', marginTop: 16,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.25)',
    gap: 8,
  },
  bestTimeText: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },

  // Loyalty section
  loyaltyStripData: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  loyaltyStat: { color: 'rgba(255,255,255,0.55)', fontSize: 12 },
  loyaltyBarContainer: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  loyaltyBar: { height: '100%', borderRadius: 5 },

  // Benchmarks
  benchmarkSummaryText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center', marginTop: 18 },

  // Churn
  churnBtn: { marginTop: 16, backgroundColor: '#F43F5E', width: 220, alignSelf: 'flex-start' },

  // Notifications
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationsSheet: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 22,
    maxHeight: '70%',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  notificationsTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  activityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  activityTitle: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  activityMeta: { color: 'rgba(255,255,255,0.48)', fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  emptyActivityText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, paddingVertical: 8 },
  inviteCard: {
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 10,
  },
  activityRowNoBorder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingBottom: 10,
  },
  inviteActions: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
  acceptBtn: { backgroundColor: '#22C55E' },
  acceptBtnText: { color: '#fff', fontWeight: '700' },
  rejectBtn: { borderColor: 'rgba(239,68,68,0.5)' },
  rejectBtnText: { color: '#FCA5A5', fontWeight: '700' },
});
