import React, { useEffect, useState } from 'react';
import { View, Image, ScrollView, StyleSheet, Alert, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Check, X, Clock3 } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

interface BoostRequestRow {
  id: string;
  artist_id: string;
  plan_name: string;
  amount: number;
  duration_days: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
}

interface Props { navigate: (screen: string) => void; }

export default function ApproveBoost({ navigate }: Props) {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [requests, setRequests] = useState<(BoostRequestRow & { artistName: string; avatarUrl: string | null })[]>([]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('boost_requests')
        .select('id, artist_id, plan_name, amount, duration_days, status, requested_at')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });
      if (error) throw error;
      const rows = (data || []) as BoostRequestRow[];
      if (rows.length === 0) {
        setRequests([]);
        return;
      }

      const artistIds = Array.from(new Set(rows.map((r) => r.artist_id)));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url')
        .in('user_id', artistIds);

      const byId = (profiles || []).reduce((acc: Record<string, any>, p: any) => {
        acc[p.user_id] = p;
        return acc;
      }, {});

      setRequests(
        rows.map((r) => ({
          ...r,
          artistName: byId[r.artist_id]?.display_name || byId[r.artist_id]?.username || 'Artist',
          avatarUrl: byId[r.artist_id]?.avatar_url || null,
        }))
      );
    } catch (e) {
      console.error('Failed to fetch boost requests', e);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const resolveRequest = async (
    req: BoostRequestRow,
    decision: 'approved' | 'rejected'
  ) => {
    setActionId(req.id);
    try {
      // Call SECURITY DEFINER function so profile update works even with RLS enabled.
      const { error: rpcErr } = await supabase.rpc('resolve_boost_request', {
        p_request_id: req.id,
        p_decision: decision,
      });
      if (rpcErr) throw rpcErr;

      setRequests((prev) => prev.filter((r) => r.id !== req.id));
      Alert.alert(
        'Updated',
        decision === 'approved' ? 'Boost approved and profile activated.' : 'Boost request rejected.'
      );
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to process request.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Approve Boosts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Clock3 size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Pending boost approvals</Text>
              <Text style={styles.infoText}>Review artist profile, then approve or reject the request.</Text>
            </View>
          </View>
        </Card>
        {loading ? (
          <ActivityIndicator color="#22D3EE" style={{ marginTop: 20 }} />
        ) : requests.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No pending boost requests</Text>
            <Text style={styles.emptySub}>All requests are processed.</Text>
            <Button variant="outline" size="sm" onPress={fetchRequests} style={{ marginTop: 12 }}>
              <Text style={{ color: '#fff' }}>Refresh</Text>
            </Button>
          </Card>
        ) : (
          requests.map((b) => (
            <Card key={b.id} style={styles.boostCard}>
              <Pressable
                style={styles.artistLink}
                onPress={() =>
                  navigate('artist-profile', {
                    selectedArtist: { user_id: b.artist_id },
                    returnTo: 'approve-boost',
                  })
                }
              >
                <Image
                  source={{ uri: b.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop' }}
                  style={styles.avatar}
                />
                <View style={styles.boostInfo}>
                  <Text style={styles.artistName}>{b.artistName}</Text>
                  <Text style={styles.plan}>{b.plan_name} - ${b.amount}</Text>
                  <Text style={styles.meta}>{b.duration_days} days • Requested {new Date(b.requested_at).toLocaleDateString()}</Text>
                </View>
              </Pressable>
              <View style={styles.boostActions}>
                <Button
                  variant="outline"
                  size="sm"
                  onPress={() => resolveRequest(b, 'rejected')}
                  disabled={actionId === b.id}
                >
                  <X size={16} color="#f87171" />
                </Button>
                <Button
                  size="sm"
                  style={styles.approveBtn}
                  onPress={() => resolveRequest(b, 'approved')}
                  disabled={actionId === b.id}
                >
                  {actionId === b.id ? <ActivityIndicator color="#fff" size="small" /> : <Check size={16} color="#fff" />}
                </Button>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 64,
    paddingBottom: 14,
  },
  title: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.7 },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.85)',
  },
  infoTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 2 },
  infoText: { color: 'rgba(255,255,255,0.65)', fontSize: 12 },
  boostCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 26,
    padding: 14,
    marginBottom: 12,
  },
  artistLink: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 52, height: 52, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  boostInfo: { flex: 1, marginLeft: 16 },
  artistName: { color: '#fff', fontWeight: '700', fontSize: 16 },
  plan: { color: 'rgba(255,255,255,0.72)', fontSize: 14, marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.45)', fontSize: 12, marginTop: 5 },
  boostActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { backgroundColor: '#22c55e', borderRadius: 12 },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  emptyTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  emptySub: { color: 'rgba(255,255,255,0.6)', marginTop: 6 },
});
