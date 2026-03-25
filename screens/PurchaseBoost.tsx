import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Sparkles, TrendingUp, Zap, Check } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

const plans = [
  { id: 1, name: 'Basic Boost', durationDays: 7, price: 29, icon: Sparkles, popular: false },
  { id: 2, name: 'Pro Boost', durationDays: 14, price: 49, icon: TrendingUp, popular: true },
  { id: 3, name: 'Premium Boost', durationDays: 30, price: 89, icon: Zap, popular: false },
];

interface Props { navigate: (screen: string) => void; }

export default function PurchaseBoost({ navigate }: Props) {
  const { appUser, profile, fetchProfile } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any | null>(null);
  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) || plans[1],
    [selectedPlanId]
  );

  useEffect(() => {
    const fetchPending = async () => {
      if (!appUser?.id) return;
      const { data } = await supabase
        .from('boost_requests')
        .select('*')
        .eq('artist_id', appUser.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingRequest(data || null);
    };
    fetchPending();
  }, [appUser?.id]);

  const handleSubmitBoostRequest = async () => {
    if (!appUser?.id) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }
    if (pendingRequest) {
      Alert.alert('Pending request', 'You already have a pending boost request.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('boost_requests').insert({
        artist_id: appUser.id,
        plan_name: selectedPlan.name,
        duration_days: selectedPlan.durationDays,
        amount: selectedPlan.price,
        status: 'pending',
      });
      if (error) throw error;

      Alert.alert(
        'Request submitted',
        'Your boost request has been sent to admin for approval.'
      );
      const { data } = await supabase
        .from('boost_requests')
        .select('*')
        .eq('artist_id', appUser.id)
        .eq('status', 'pending')
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setPendingRequest(data || null);
      if (fetchProfile) await fetchProfile();
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not submit boost request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Boost Your Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <TrendingUp size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Get More Bookings</Text>
              <Text style={styles.infoText}>Boost your visibility and reach more event organizers.</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>Choose a plan</Text>
        {plans.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.id} style={[styles.planCard, p.popular && styles.planCardPopular]}>
              {p.popular && (
                <View style={styles.popularBar}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}
              <View style={styles.planBody}>
                <View style={styles.planHeader}>
                  <View style={styles.planIcon}><Icon size={24} color="#fff" /></View>
                  <View style={styles.planInfo}><Text style={styles.planName}>{p.name}</Text><Text style={styles.planDur}>{p.durationDays} Days</Text></View>
                  <Text style={styles.planPrice}>${p.price}</Text>
                </View>
                <Button
                  onPress={() => setSelectedPlanId(p.id)}
                  style={selectedPlanId === p.id ? styles.selectBtnPrimary : styles.selectBtn}
                >
                  <Text style={styles.selectBtnText}>{selectedPlanId === p.id ? 'Selected' : `Select ${p.name}`}</Text>
                </Button>
              </View>
            </Card>
          );
        })}

        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>Payment details</Text>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Plan</Text><Text style={styles.summaryValue}>{selectedPlan.name}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Duration</Text><Text style={styles.summaryValue}>{selectedPlan.durationDays} days</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Amount</Text><Text style={styles.summaryValue}>${selectedPlan.price}</Text></View>
          <Text style={styles.infoTextSmall}>
            Payment gateway is disabled for now. Tapping continue sends this request to admin for approval.
          </Text>
          {pendingRequest && (
            <View style={styles.pendingPill}>
              <Check size={14} color="#CFFAFE" />
              <Text style={styles.pendingPillText}>Your previous request is pending admin review.</Text>
            </View>
          )}
          <Button
            style={styles.requestBtn}
            onPress={handleSubmitBoostRequest}
            disabled={submitting || !!pendingRequest}
          >
            {submitting ? (
              <ActivityIndicator color="#162447" />
            ) : (
              <Text style={styles.requestBtnText}>
                {pendingRequest ? 'Request Pending Approval' : 'Agree & Send Request'}
              </Text>
            )}
          </Button>
          <View style={[styles.statusRow, { marginTop: 12 }]}>
            <View>
              <Text style={styles.statusLabel}>Current profile status</Text>
              <Badge style={styles.statusBadge}>
                {profile?.is_boosted ? `Boosted${profile?.boost_expiry ? ` until ${new Date(profile.boost_expiry).toLocaleDateString()}` : ''}` : 'Not boosted'}
              </Badge>
            </View>
            <Button variant="outline" size="sm" onPress={() => navigate('artist-dashboard')}>
              <Text style={styles.renewText}>Done</Text>
            </Button>
          </View>
        </Card>
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
  sectionTitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    padding: 18,
    marginBottom: 18,
  },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(34,211,238,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  infoText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 28,
    marginBottom: 14,
    overflow: 'hidden',
  },
  planCardPopular: { borderColor: 'rgba(34,211,238,0.55)' },
  popularBar: { backgroundColor: 'rgba(34,211,238,0.9)', paddingVertical: 5, alignItems: 'center' },
  popularText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  planBody: { padding: 20 },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  planIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(34,211,238,0.9)', alignItems: 'center', justifyContent: 'center' },
  planInfo: { flex: 1, marginLeft: 12 },
  planName: { color: '#fff', fontSize: 20, fontWeight: '800' },
  planDur: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  planPrice: { color: '#fff', fontSize: 28, fontWeight: '800' },
  selectBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999 },
  selectBtnPrimary: { backgroundColor: '#22D3EE', borderRadius: 999 },
  selectBtnText: { color: '#fff' },
  statusCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 30,
    padding: 20,
    marginTop: 4,
  },
  statusTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  infoTextSmall: { color: 'rgba(255,255,255,0.65)', fontSize: 12, marginTop: 8, marginBottom: 12 },
  pendingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(34,211,238,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(34,211,238,0.45)',
    marginBottom: 12,
  },
  pendingPillText: { color: '#CFFAFE', fontSize: 12, fontWeight: '600', flex: 1 },
  requestBtn: { backgroundColor: '#FDF2FF', borderRadius: 999, minHeight: 44 },
  requestBtnText: { color: '#162447', fontWeight: '800' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 4 },
  statusBadge: { backgroundColor: 'rgba(34,211,238,0.2)', borderWidth: 0, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  renewText: { color: '#fff' },
});
