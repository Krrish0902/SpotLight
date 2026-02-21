import React, { useState, useEffect } from 'react';
import { View, Image, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Calendar, MessageSquare, TrendingUp, Bell, Settings, CheckCircle2, Clock, X, MapPin } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface OrganizerEvent {
  event_id: string;
  title: string;
  event_date: string;
  location_name: string | null;
  city: string | null;
  poster_url: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface Props { navigate: (screen: string, data?: any) => void; }

export default function OrganizerDashboard({ navigate }: Props) {
  const { profile, appUser } = useAuth();
  const displayName = profile?.display_name ?? appUser?.email?.split('@')[0] ?? 'Organizer';
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    if (!appUser?.id) return;
    try {
      const { data, error } = await supabase
        .from('events')
        .select('event_id, title, event_date, location_name, city, poster_url, approval_status')
        .eq('organizer_id', appUser.id)
        .eq('is_deleted', false)
        .order('event_date', { ascending: false });
      if (error) throw error;
      setEvents(data ?? []);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [appUser?.id]);

  const now = new Date().toISOString();
  const totalEvents = events.length;
  const upcomingCount = events.filter((e) => e.event_date >= now).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View><Text style={styles.title}>Dashboard</Text><Text style={styles.subtitle}>Welcome back, {displayName}!</Text></View>
          <View style={styles.headerBtns}>
            <Button variant="ghost" size="icon"><Bell size={24} color="#fff" /></Button>
            <Button variant="ghost" size="icon"><Settings size={24} color="#fff" /></Button>
          </View>
        </View>

        <Card style={styles.searchCard} onPress={() => navigate('search-discover')}>
          <LinearGradient colors={['#9333ea', '#db2777']} style={styles.searchGradient}>
            <View style={styles.searchContent}>
              <View style={styles.searchIcon}><Search size={28} color="#fff" /></View>
              <View style={styles.searchText}><Text style={styles.searchTitle}>Find Artists</Text><Text style={styles.searchDesc}>Discover talented performers</Text></View>
            </View>
          </LinearGradient>
        </Card>

        <Card style={styles.createEventCard} onPress={() => navigate('create-event', { mode: 'create', event: null })}>
          <LinearGradient colors={['#a855f7', '#7c3aed']} style={styles.createEventGradient}>
            <View style={styles.searchContent}>
              <View style={styles.searchIcon}><Calendar size={28} color="#fff" /></View>
              <View style={styles.searchText}>
                <Text style={styles.searchTitle}>Create Event</Text>
                <Text style={styles.searchDesc}>Host a new live event</Text>
              </View>
            </View>
          </LinearGradient>
        </Card>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}><TrendingUp size={24} color="#a855f7" /><Text style={styles.statNum}>{totalEvents}</Text><Text style={styles.statLabel}>Events</Text></Card>
          <Card style={styles.statCard}><MessageSquare size={24} color="#60a5fa" /><Text style={styles.statNum}>—</Text><Text style={styles.statLabel}>Bookings</Text></Card>
          <Card style={styles.statCard}><Calendar size={24} color="#4ade80" /><Text style={styles.statNum}>{upcomingCount}</Text><Text style={styles.statLabel}>Upcoming</Text></Card>
        </View>

        <Text style={styles.sectionTitle}>My Events</Text>
        {loading ? (
          <View style={styles.loadingRow}><ActivityIndicator size="large" color="#a855f7" /></View>
        ) : events.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>You haven't created any events yet.</Text>
            <Button style={styles.emptyBtn} onPress={() => navigate('create-event', { mode: 'create', event: null })}>Create Event</Button>
          </Card>
        ) : (
          events.map((e) => (
            <Pressable key={e.event_id} onPress={() => navigate('event-details', { eventId: e.event_id })}>
              <Card style={styles.eventCard}>
                <Image source={{ uri: e.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop' }} style={styles.eventImg} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{e.title}</Text>
                  <View style={styles.eventMeta}>
                    <Calendar size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.eventDate}>{new Date(e.event_date).toLocaleDateString()}</Text>
                  </View>
                  {(e.location_name || e.city) && (
                    <View style={styles.eventMeta}>
                      <MapPin size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.eventLocation} numberOfLines={1}>{[e.location_name, e.city].filter(Boolean).join(', ')}</Text>
                    </View>
                  )}
                  {e.approval_status === 'pending' && <Badge icon={<Clock size={12} color="#fb923c" />} style={styles.pendingBadge}>Pending</Badge>}
                  {e.approval_status === 'approved' && <Badge icon={<CheckCircle2 size={12} color="#4ade80" />} style={styles.confirmedBadge}>Approved</Badge>}
                  {e.approval_status === 'rejected' && <Badge icon={<X size={12} color="#f87171" />} style={styles.declinedBadge}>Rejected</Badge>}
                </View>
              </Card>
            </Pressable>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="home" navigate={navigate} userRole="organizer" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)', paddingBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  searchCard: { borderWidth: 0, overflow: 'hidden', marginBottom: 12 },
  createEventCard: { borderWidth: 0, overflow: 'hidden', marginBottom: 24 },
  createEventGradient: { padding: 24 },
  searchGradient: { padding: 24 },
  searchContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  searchIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  searchText: { flex: 1 },
  searchTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  searchDesc: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  loadingRow: { padding: 32, alignItems: 'center' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 12, alignItems: 'center' },
  emptyText: { color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  emptyBtn: { minWidth: 140 },
  eventCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 0, marginBottom: 12, overflow: 'hidden', flexDirection: 'row' },
  eventImg: { width: 80, height: 80, borderRadius: 0 },
  eventInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  eventTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  eventDate: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  eventLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 13, flex: 1 },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 0 },
  confirmedBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 0 },
  declinedBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 0 },
});
