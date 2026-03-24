import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../components/ui/Text';
import { ChevronLeft, Ban, CheckCircle, Flag, UserRoundSearch } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import { supabase } from '../lib/supabase';
import { getSuspendedUserIds } from '../lib/suspension';
import { useAuth } from '../lib/auth-context';

interface Props { navigate: (screen: string, data?: any) => void; }

interface ReportRow {
  report_id: string;
  report_type: 'video' | 'profile';
  target_id: string;
  reported_by: string;
  reason: string;
  status: string;
  created_at: string;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface UserRow {
  user_id: string;
  email: string | null;
  role: string | null;
  status?: string | null;
}

interface SuspendRpcResult {
  ok: boolean;
  message?: string | null;
}

export default function ManageProfiles({ navigate }: Props) {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [suspendedUserIds, setSuspendedUserIds] = useState<string[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [usersMap, setUsersMap] = useState<Record<string, UserRow>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const suspendUser = async (targetId: string) => {
    const { data, error } = await supabase.rpc('admin_suspend_user', {
      p_target_user_id: targetId,
    });
    if (error) throw error;
    const result = Array.isArray(data) ? (data[0] as SuspendRpcResult | undefined) : (data as SuspendRpcResult | null);
    if (result && result.ok === false) {
      throw new Error(result.message || 'Suspend failed.');
    }
  };

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const [{ data: reportRows, error: reportsError }, { data: moderationRows, error: moderationError }, { data: dbSuspendedUsers }] =
        await Promise.all([
          supabase
            .from('reports')
            .select('*')
            .eq('report_type', 'profile')
            .eq('status', 'pending')
            .order('created_at', { ascending: false }),
          supabase
            .from('reports')
            .select('target_id, resolution_action, created_at')
            .eq('report_type', 'profile')
            .eq('status', 'resolved')
            .in('resolution_action', ['suspend_account', 'unsuspend_account']),
          supabase.from('users').select('user_id').eq('status', 'suspended'),
        ]);
      if (reportsError) throw reportsError;
      if (moderationError) throw moderationError;
      const queue = (reportRows as ReportRow[]) || [];
      setReports(queue);

      const candidateIds = new Set<string>();
      queue.forEach((r) => {
        candidateIds.add(r.target_id);
        candidateIds.add(r.reported_by);
      });
      (moderationRows || []).forEach((row: any) => {
        const id = String(row.target_id || '');
        if (id) candidateIds.add(id);
      });
      (dbSuspendedUsers || []).forEach((u: any) => {
        if (u.user_id) candidateIds.add(u.user_id);
      });
      const suspendedSet = await getSuspendedUserIds([...candidateIds]);
      setSuspendedUserIds([...suspendedSet]);
      const suspendedIds = [...suspendedSet];

      const userIds = Array.from(
        new Set([...queue.flatMap((r) => [r.target_id, r.reported_by]), ...suspendedIds].filter(Boolean))
      );
      if (userIds.length === 0) {
        setProfilesMap({});
        setUsersMap({});
        return;
      }

      const [profileRes, usersRes] = await Promise.all([
        supabase.from('profiles').select('user_id, display_name, username, avatar_url').in('user_id', userIds),
        supabase.from('users').select('user_id, email, role, status').in('user_id', userIds),
      ]);
      if (profileRes.error) throw profileRes.error;
      if (usersRes.error) throw usersRes.error;

      const pMap: Record<string, ProfileRow> = {};
      (profileRes.data || []).forEach((p: any) => { pMap[p.user_id] = p; });
      setProfilesMap(pMap);

      const uMap: Record<string, UserRow> = {};
      (usersRes.data || []).forEach((u: any) => { uMap[u.user_id] = u; });
      setUsersMap(uMap);
    } catch (e) {
      console.error('Failed to fetch profile report queue:', e);
      setReports([]);
      setProfilesMap({});
      setUsersMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const groupedTargets = useMemo(() => {
    const count: Record<string, number> = {};
    reports.forEach((r) => {
      count[r.target_id] = (count[r.target_id] || 0) + 1;
    });
    return Array.from(new Set(reports.map((r) => r.target_id))).map((targetId) => ({
      targetId,
      count: count[targetId] || 0,
      latestReport: reports.find((r) => r.target_id === targetId),
    }));
  }, [reports]);

  const suspendedTargets = useMemo(() => {
    return suspendedUserIds.map((targetId) => ({
      targetId,
      profile: profilesMap[targetId],
      user: usersMap[targetId],
    }));
  }, [suspendedUserIds, profilesMap, usersMap]);

  const unsuspendUser = async (targetId: string) => {
    const rpc = await supabase.rpc('admin_unsuspend_user', {
      p_target_user_id: targetId,
    });
    if (rpc.error) {
      // Fallback if RPC is not created yet.
      const { error: fallbackError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('user_id', targetId);
      if (fallbackError) throw fallbackError;
    }

    // Write moderation trail so app logic can resolve suspension state consistently.
    if (appUser?.id) {
      await supabase.from('reports').insert({
        report_type: 'profile',
        target_id: targetId,
        reported_by: appUser.id,
        reason: 'admin_unsuspend',
        status: 'resolved',
        resolution_action: 'unsuspend_account',
        resolved_at: new Date().toISOString(),
      });
    }
  };

  const resolveProfileReports = async (targetId: string, action: 'dismiss' | 'suspend_account') => {
    setActionLoadingId(targetId);
    try {
      if (action === 'suspend_account') {
        await suspendUser(targetId);
        setUsersMap((prev) => ({
          ...prev,
          [targetId]: { ...(prev[targetId] || { user_id: targetId, email: null, role: null }), status: 'suspended' },
        }));
      }
      const { error: resolveError } = await supabase
        .from('reports')
        .update({
          status: 'resolved',
          resolution_action: action,
          resolved_at: new Date().toISOString(),
          admin_note: notes[targetId] || null,
        })
        .eq('report_type', 'profile')
        .eq('target_id', targetId)
        .eq('status', 'pending');
      if (resolveError) throw resolveError;
      setReports((prev) => prev.filter((r) => r.target_id !== targetId));
      if (action === 'suspend_account') {
        setSuspendedUserIds((prev) => (prev.includes(targetId) ? prev : [targetId, ...prev]));
      }
      if (action === 'suspend_account') {
        Alert.alert('Account suspended', 'User status was updated to suspended.');
      }
    } catch (e: any) {
      console.error('Failed to resolve profile reports:', e);
      Alert.alert('Error', e?.message || 'Could not process this report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmSuspend = (targetId: string) => {
    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Suspend account? The user account will be marked suspended.')
        : true;
      if (ok) resolveProfileReports(targetId, 'suspend_account');
      return;
    }
    Alert.alert(
      'Suspend account?',
      'The user account will be marked suspended.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Suspend', style: 'destructive', onPress: () => resolveProfileReports(targetId, 'suspend_account') },
      ]
    );
  };

  const confirmUnsuspend = (targetId: string) => {
    const run = async () => {
      setActionLoadingId(targetId);
      try {
        await unsuspendUser(targetId);
        setUsersMap((prev) => ({
          ...prev,
          [targetId]: { ...(prev[targetId] || { user_id: targetId, email: null, role: null }), status: 'active' },
        }));
        setSuspendedUserIds((prev) => prev.filter((id) => id !== targetId));
        Alert.alert('Account reactivated', 'User is now active again.');
      } catch (e: any) {
        console.error('Failed to unsuspend user:', e);
        Alert.alert('Error', e?.message || 'Could not unsuspend this account.');
      } finally {
        setActionLoadingId(null);
      }
    };

    if (Platform.OS === 'web') {
      const ok = typeof window !== 'undefined'
        ? window.confirm('Reactivate this account?')
        : true;
      if (ok) run();
      return;
    }
    Alert.alert('Reactivate account?', 'This will restore account access.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reactivate', onPress: run },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Profiles</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.stats}>
        <View style={styles.statCard}><Text style={styles.statNum}>{reports.length}</Text><Text style={styles.statLabel}>Pending</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{suspendedTargets.length}</Text><Text style={styles.statLabel}>Suspended</Text></View>
      </View>

      <View style={styles.tabsWrap}>
      <Tabs defaultValue="pending" tabs={[{ value: 'pending', label: 'Pending' }, { value: 'suspended', label: 'Suspended' }]}>
        {(tab) => (
          <ScrollView contentContainerStyle={styles.userList}>
            {loading ? (
              <View style={styles.stateWrap}>
                <ActivityIndicator color="#22D3EE" size="large" />
                <Text style={styles.stateText}>Loading profile moderation queue...</Text>
              </View>
            ) : tab === 'pending' && groupedTargets.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No pending profile reports</Text>
                <Text style={styles.emptyText}>Nothing needs moderation right now.</Text>
              </Card>
            ) : tab === 'suspended' && suspendedTargets.length === 0 ? (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No suspended accounts</Text>
                <Text style={styles.emptyText}>Suspended users will appear here for reactivation.</Text>
              </Card>
            ) : tab === 'pending' ? (
              groupedTargets.map((entry) => {
                const targetProfile = profilesMap[entry.targetId];
                const targetUser = usersMap[entry.targetId];
                const latest = entry.latestReport;
                const reporterProfile = latest ? profilesMap[latest.reported_by] : null;
                if (!latest) return null;
                return (
                  <View key={entry.targetId} style={styles.userCard}>
                    <View style={styles.profileTopRow}>
                      <Image
                        source={{ uri: targetProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                        style={styles.userImg}
                      />
                      <View style={styles.userInfo}>
                      <View style={styles.userHeader}>
                        <Text style={styles.userName}>{targetProfile?.display_name || targetProfile?.username || 'Unknown user'}</Text>
                        <Badge style={styles.reportCountBadge}>{entry.count} reports</Badge>
                      </View>
                      <Text style={styles.userEmail}>{targetUser?.email || 'No email'}</Text>
                      <Text style={styles.userJoin}>Reported by {reporterProfile?.display_name || reporterProfile?.username || 'user'}</Text>
                      <View style={styles.reasonRow}>
                        <Flag size={13} color="#F97316" />
                        <Text style={styles.reasonText}>{latest.reason || 'unspecified'}</Text>
                      </View>
                      {targetUser?.status === 'suspended' ? (
                        <Badge icon={<Ban size={12} color="#f87171" />} style={styles.suspendedBadge}>Suspended</Badge>
                      ) : (
                        <Badge icon={<CheckCircle size={12} color="#4ade80" />} style={styles.activeBadge}>Active</Badge>
                      )}
                      </View>
                    </View>
                    <View style={styles.inspectRow}>
                      <Button
                        variant="outline"
                        size="sm"
                        style={styles.inspectBtn}
                        onPress={() =>
                          navigate('artist-profile', {
                            selectedArtist: { user_id: entry.targetId },
                            returnTo: 'manage-profiles',
                          })
                        }
                      >
                        <UserRoundSearch size={14} color="#67E8F9" />
                        <Text style={styles.inspectText}>Inspect Profile</Text>
                      </Button>
                    </View>
                      <Textarea
                        placeholder="Admin note (optional)"
                        style={styles.noteInput}
                        value={notes[entry.targetId] || ''}
                        onChangeText={(val) => setNotes((prev) => ({ ...prev, [entry.targetId]: val }))}
                      />
                      <View style={styles.userActions}>
                        <Button
                          variant="outline"
                          size="sm"
                          style={styles.dismissBtn}
                          disabled={actionLoadingId === entry.targetId}
                          onPress={() => resolveProfileReports(entry.targetId, 'dismiss')}
                        >
                          <Text style={styles.actionText}>Dismiss</Text>
                        </Button>
                        <Button
                          size="sm"
                          style={styles.suspendBtn}
                          disabled={actionLoadingId === entry.targetId}
                          onPress={() => confirmSuspend(entry.targetId)}
                        >
                          <Ban size={14} color="#162447" />
                          <Text style={styles.suspendText}>Suspend</Text>
                        </Button>
                      </View>
                  </View>
                );
              })
            ) : (
              suspendedTargets.map((entry) => (
                <View key={entry.targetId} style={styles.userCard}>
                  <View style={styles.profileTopRow}>
                    <Image
                      source={{ uri: entry.profile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                      style={styles.userImg}
                    />
                    <View style={styles.userInfo}>
                      <View style={styles.userHeader}>
                        <Text style={styles.userName}>{entry.profile?.display_name || entry.profile?.username || 'Unknown user'}</Text>
                      </View>
                      <Text style={styles.userEmail}>{entry.user?.email || 'No email'}</Text>
                      <Badge icon={<Ban size={12} color="#f87171" />} style={styles.suspendedBadge}>Suspended</Badge>
                    </View>
                  </View>
                  <View style={styles.userActions}>
                    <Button
                      size="sm"
                      style={styles.reactivateBtn}
                      disabled={actionLoadingId === entry.targetId}
                      onPress={() => confirmUnsuspend(entry.targetId)}
                    >
                      <CheckCircle size={14} color="#162447" />
                      <Text style={styles.reactivateText}>Unsuspend</Text>
                    </Button>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 62, paddingBottom: 14 },
  headerSpacer: { width: 40 },
  title: { fontSize: 33, fontWeight: '800', color: '#ffffff', letterSpacing: -0.9 },
  stats: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 16 },
  tabsWrap: { paddingHorizontal: 16 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 24, borderRadius: 32, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  statLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  userList: { paddingTop: 4, gap: 16, paddingBottom: 100 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 10 },
  stateText: { color: 'rgba(255,255,255,0.65)' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', padding: 18 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#8E8E93', marginTop: 6 },
  userCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 30, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  profileTopRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  userImg: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  userName: { flex: 1, fontSize: 35, fontWeight: '800', color: '#ffffff', letterSpacing: -0.8 },
  reportCountBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(249,115,22,0.45)', paddingHorizontal: 9, paddingVertical: 4 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  reasonText: { color: '#FDBA74', fontSize: 13, fontWeight: '600' },
  inspectRow: { marginTop: 10 },
  inspectBtn: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    minHeight: 36,
    paddingHorizontal: 12,
    borderColor: 'rgba(34,211,238,0.35)',
    backgroundColor: 'rgba(34,211,238,0.1)',
  },
  inspectText: { color: '#67E8F9', fontWeight: '700', fontSize: 13 },
  noteInput: {
    marginTop: 10,
    marginBottom: 6,
    minHeight: 70,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  dismissBtn: { flex: 1, minWidth: 100, minHeight: 44, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, paddingVertical: 10, alignItems: 'center' },
  suspendBtn: { flex: 1, minWidth: 100, minHeight: 44, backgroundColor: '#FDF2FF', borderRadius: 100, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  suspendText: { color: '#162447', fontSize: 15, fontWeight: '800' },
  reactivateBtn: { flex: 1, minHeight: 44, backgroundColor: '#FDF2FF', borderRadius: 100, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  reactivateText: { color: '#162447', fontSize: 15, fontWeight: '800' },
  userEmail: { color: '#8E8E93', fontSize: 14 },
  userJoin: { color: '#8E8E93', fontSize: 13 },
  activeBadge: { backgroundColor: 'rgba(253,242,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  suspendedBadge: { backgroundColor: 'rgba(255,59,48,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  userActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
});