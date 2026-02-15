import React from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Calendar, MessageSquare, TrendingUp, Bell, Settings, CheckCircle2, Clock, X } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';

const bookingRequests = [
  { id: 1, artist: 'Maya Rivers', event: 'Summer Music Festival', date: 'June 15, 2026', status: 'pending', image: 'photo-1493225457124-a3eb161ffa5f' },
  { id: 2, artist: 'DJ Eclipse', event: 'Corporate Party', date: 'July 20, 2026', status: 'confirmed', image: 'photo-1571609572760-64c0cd10b5ca' },
  { id: 3, artist: 'The Neon Lights', event: 'Wedding Reception', date: 'August 5, 2026', status: 'declined', image: 'photo-1516450360452-9312f5e86fc7' },
];

interface Props { navigate: (screen: string, data?: any) => void; }

export default function OrganizerDashboard({ navigate }: Props) {
  const { profile, appUser } = useAuth();
  const displayName = profile?.display_name ?? appUser?.email?.split('@')[0] ?? 'Organizer';

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

        <Card style={styles.createEventCard} onPress={() => navigate('create-event')}>
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
          <Card style={styles.statCard}><TrendingUp size={24} color="#a855f7" /><Text style={styles.statNum}>12</Text><Text style={styles.statLabel}>Events</Text></Card>
          <Card style={styles.statCard}><MessageSquare size={24} color="#60a5fa" /><Text style={styles.statNum}>8</Text><Text style={styles.statLabel}>Bookings</Text></Card>
          <Card style={styles.statCard}><Calendar size={24} color="#4ade80" /><Text style={styles.statNum}>3</Text><Text style={styles.statLabel}>Upcoming</Text></Card>
        </View>

        <Text style={styles.sectionTitle}>Booking Requests</Text>
        {bookingRequests.map((r) => (
          <Card key={r.id} style={styles.bookingCard}>
            <View style={styles.bookingRow}>
              <Image source={{ uri: `https://images.unsplash.com/${r.image}?w=200&h=200&fit=crop` }} style={styles.bookingImg} />
              <View style={styles.bookingInfo}><Text style={styles.bookingArtist}>{r.artist}</Text><Text style={styles.bookingEvent}>{r.event}</Text><Text style={styles.bookingDate}>{r.date}</Text></View>
              {r.status === 'pending' && <Badge icon={<Clock size={12} color="#fb923c" />} style={styles.pendingBadge}>Pending</Badge>}
              {r.status === 'confirmed' && <Badge icon={<CheckCircle2 size={12} color="#4ade80" />} style={styles.confirmedBadge}>Confirmed</Badge>}
              {r.status === 'declined' && <Badge icon={<X size={12} color="#f87171" />} style={styles.declinedBadge}>Declined</Badge>}
            </View>
            {r.status === 'pending' && (
              <View style={styles.bookingActions}>
                <Button variant="outline" size="sm" style={styles.bookingBtn}><Text style={styles.bookingBtnText}>Cancel</Text></Button>
                <Button size="sm" style={[styles.bookingBtn, styles.primaryBtn]} onPress={() => navigate('messaging', { selectedArtist: { name: r.artist } })}><MessageSquare size={16} color="#fff" /><Text style={styles.bookingBtnText}>Message</Text></Button>
              </View>
            )}
          </Card>
        ))}
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
  bookingCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 12 },
  bookingRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bookingImg: { width: 56, height: 56, borderRadius: 8 },
  bookingInfo: { flex: 1 },
  bookingArtist: { color: '#fff', fontWeight: '600' },
  bookingEvent: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  bookingDate: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 0 },
  confirmedBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 0 },
  declinedBadge: { backgroundColor: 'rgba(239,68,68,0.2)', borderWidth: 0 },
  bookingActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  bookingBtn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  bookingBtnText: { color: '#fff' },
});
