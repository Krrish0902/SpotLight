import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Video, Calendar, Trophy, DollarSign, LogOut, Flag } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Props { navigate: (screen: string) => void; }

export default function AdminDashboard({ navigate }: Props) {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVideos: 0,
    totalBookings: 0,
    revenue: 0,
    pendingEvents: 0,
    recentVideos7d: 0,
    pendingVideoReports: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<{ text: string; time: string; color: string }>>([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

        const [
          usersCountRes,
          videosCountRes,
          bookingsCountRes,
          pendingEventsCountRes,
          recentVideosCountRes,
          pendingVideoReportsRes,
          ticketsRes,
          latestUsersRes,
          latestEventsRes,
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('videos').select('*', { count: 'exact', head: true }),
          supabase.from('bookings').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending').eq('is_deleted', false),
          supabase.from('videos').select('*', { count: 'exact', head: true }).gte('upload_date', sevenDaysAgo),
          supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('report_type', 'video')
            .eq('status', 'pending'),
          supabase.from('tickets').select('total_amount'),
          supabase.from('users').select('created_at').order('created_at', { ascending: false }).limit(3),
          supabase.from('events').select('title, created_at, approval_status').eq('is_deleted', false).order('created_at', { ascending: false }).limit(3),
        ]);

        const revenue = (ticketsRes.data || []).reduce((sum: number, t: any) => sum + Number(t.total_amount || 0), 0);
        setStats({
          totalUsers: usersCountRes.count || 0,
          totalVideos: videosCountRes.count || 0,
          totalBookings: bookingsCountRes.count || 0,
          revenue,
          pendingEvents: pendingEventsCountRes.count || 0,
          recentVideos7d: recentVideosCountRes.count || 0,
          pendingVideoReports: pendingVideoReportsRes.count || 0,
        });

        const activities: Array<{ text: string; time: string; color: string }> = [];
        (latestUsersRes.data || []).forEach((u: any) => {
          activities.push({
            text: 'New user registered',
            time: formatRelativeTime(u.created_at),
            color: '#4ade80',
          });
        });
        (latestEventsRes.data || []).forEach((e: any) => {
          activities.push({
            text: `Event submitted: ${e.title}`,
            time: formatRelativeTime(e.created_at),
            color: e.approval_status === 'pending' ? '#fb923c' : '#22D3EE',
          });
        });
        setRecentActivity(
          activities
            .sort((a, b) => (a.time === 'just now' ? -1 : b.time === 'just now' ? 1 : 0))
            .slice(0, 5)
        );
      } catch (e) {
        console.error('Failed to load admin metrics:', e);
        setRecentActivity([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const revenueDisplay = useMemo(() => `$${(stats.revenue / 1000).toFixed(1)}K`, [stats.revenue]);

  const formatRelativeTime = (iso?: string | null) => {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const diffMins = Math.floor((Date.now() - t) / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const hrs = Math.floor(diffMins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Dashboard</Text>
          <Text style={styles.subtitle}>Manage your platform</Text>
        </View>
        <Button variant="outline" size="sm" onPress={async () => { await signOut(); navigate('public-home'); }} style={styles.signOutBtn}>
          <LogOut size={16} color="#fff" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Button>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Users size={22} color="#22D3EE" />
            </View>
            {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 12 }} /> : <Text style={styles.statNum}>{stats.totalUsers.toLocaleString()}</Text>}
            <Text style={styles.statLabel}>Total Users</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Video size={22} color="#22D3EE" />
            </View>
            {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 12 }} /> : <Text style={styles.statNum}>{stats.totalVideos.toLocaleString()}</Text>}
            <Text style={styles.statLabel}>Videos</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <Calendar size={22} color="#22D3EE" />
            </View>
            {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 12 }} /> : <Text style={styles.statNum}>{stats.totalBookings.toLocaleString()}</Text>}
            <Text style={styles.statLabel}>Bookings</Text>
          </Card>
          <Card style={styles.statCard}>
            <View style={styles.statIconWrap}>
              <DollarSign size={22} color="#22D3EE" />
            </View>
            {loading ? <ActivityIndicator color="#fff" style={{ marginTop: 12 }} /> : <Text style={styles.statNum}>{revenueDisplay}</Text>}
            <Text style={styles.statLabel}>Revenue</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <Card style={styles.actionCard} onPress={() => navigate('moderate-content')}>
          <View style={styles.actionIcon}><Flag size={20} color="#22D3EE" /></View>
          <View style={styles.actionInfo}>
            <Text style={styles.actionTitle}>Video reports</Text>
            <Text style={styles.actionDesc}>Review reported uploads</Text>
          </View>
          {!loading && stats.pendingVideoReports > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{stats.pendingVideoReports > 99 ? '99+' : stats.pendingVideoReports}</Text>
            </View>
          ) : null}
        </Card>
        <Card style={styles.actionCard} onPress={() => navigate('manage-live-events')}>
          <View style={styles.actionIcon}><Video size={20} color="#22D3EE" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Review Events</Text><Text style={styles.actionDesc}>Pending event approvals</Text></View>
          {!loading && stats.pendingEvents > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{stats.pendingEvents > 99 ? '99+' : stats.pendingEvents}</Text></View> : null}
        </Card>
        <Card style={styles.actionCard} onPress={() => navigate('approve-boost')}>
          <View style={styles.actionIcon}><Trophy size={20} color="#22D3EE" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Approve Boosts</Text><Text style={styles.actionDesc}>Manage artist boost status</Text></View>
        </Card>
        <Card style={styles.actionCard} onPress={() => navigate('manage-profiles')}>
          <View style={styles.actionIcon}><Users size={20} color="#22D3EE" /></View>
          <View style={styles.actionInfo}><Text style={styles.actionTitle}>Manage Profiles</Text><Text style={styles.actionDesc}>User management and moderation</Text></View>
          {!loading && stats.recentVideos7d > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{stats.recentVideos7d > 99 ? '99+' : stats.recentVideos7d}</Text></View> : null}
        </Card>

        <View style={styles.managementRow}>
          <Card style={styles.manageCard}>
            <Text style={styles.manageTitle}>Content & Events</Text>
            <Button variant="ghost" onPress={() => navigate('manage-contests')} style={styles.menuBtn}>
              <Trophy size={18} color="#22D3EE" />
              <Text style={styles.menuText}>Manage Contests</Text>
            </Button>
            <Button variant="ghost" onPress={() => navigate('manage-live-events')} style={styles.menuBtn}>
              <Calendar size={18} color="#22D3EE" />
              <Text style={styles.menuText}>Manage Live Events</Text>
            </Button>
           
          </Card>
          <Card style={styles.manageCard}>
            <Text style={styles.manageTitle}>Recent Activity</Text>
            {loading ? (
              <ActivityIndicator color="#fff" style={{ marginTop: 12 }} />
            ) : recentActivity.length === 0 ? (
              <Text style={styles.activityText}>No recent activity</Text>
            ) : (
              recentActivity.map((item, idx) => (
                <View key={`${item.text}-${idx}`} style={styles.activityItem}>
                  <View style={[styles.activityDot, { backgroundColor: item.color }]} />
                  <Text style={styles.activityText}>{item.text}</Text>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 72, paddingBottom: 120 },
  header: { marginBottom: 10 },
  signOutBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: 6,
    borderRadius: 999,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    minHeight: 38,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  signOutText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  title: { fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: -1.1 },
  subtitle: { color: 'rgba(255,255,255,0.56)', marginTop: 4, fontSize: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginBottom: 26 },
  statCard: {
    width: '48.5%' as const,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 132,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,211,238,0.45)',
  },
  statNum: { fontSize: 38, fontWeight: '800', color: '#fff', marginTop: 14, letterSpacing: -1 },
  statLabel: { color: 'rgba(255,255,255,0.64)', fontSize: 14, fontWeight: '600', marginTop: -2 },
  sectionTitle: { fontSize: 36, fontWeight: '800', color: '#fff', marginBottom: 14, letterSpacing: -0.8 },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(34,211,238,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,211,238,0.38)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: { flex: 1, marginLeft: 16 },
  actionTitle: { color: '#fff', fontWeight: '700', fontSize: 20, letterSpacing: -0.2 },
  actionDesc: { color: 'rgba(255,255,255,0.55)', fontSize: 16, marginTop: 2 },
  badge: { minWidth: 30, height: 30, borderRadius: 999, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  managementRow: { gap: 12, marginTop: 20 },
  manageCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 16,
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  manageTitle: { color: '#fff', fontSize: 30, fontWeight: '800', marginBottom: 10, letterSpacing: -0.6 },
  menuBtn: {
    justifyContent: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    minHeight: 42,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 6,
  },
  menuText: { color: '#fff', marginLeft: 10, fontSize: 15, fontWeight: '600' },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityText: { flex: 1, color: 'rgba(255,255,255,0.86)', fontSize: 14 },
  activityTime: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '600' },
});
