import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Settings, Sparkles, Clock, AlertCircle, RefreshCw } from 'lucide-react-native';
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
  const [recentReview, setRecentReview] = useState<any | null>(null);
  const [recentMessageRequest, setRecentMessageRequest] = useState<any | null>(null);
  const [recentEvent, setRecentEvent] = useState<any | null>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);

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
      } catch (e) {
        console.error('Error fetching dashboard activity:', e);
        setRecentReview(null);
        setRecentMessageRequest(null);
        setRecentEvent(null);
      } finally {
        setLoadingActivity(false);
      }
    };

    fetchActivity();
  }, [appUser?.id]);

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
            <Button variant="ghost" size="icon"><Bell size={20} color="rgba(255,255,255,0.5)" /></Button>
            <Button variant="ghost" size="icon"><Settings size={20} color="rgba(255,255,255,0.5)" /></Button>
          </View>
        </View>

        {isBoosted && (
          <Badge icon={<Sparkles size={12} color="#fff" />} style={styles.boostBadge}>Profile Boosted</Badge>
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
  boostBadge: { alignSelf: 'flex-start', marginBottom: 20 },

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
});
