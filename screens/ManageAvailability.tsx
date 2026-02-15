import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

interface Props { navigate: (screen: string) => void; }

export default function ManageAvailability({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Availability</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>Select dates when you are available for bookings. Organizers will be able to see and request these dates.</Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Upcoming Bookings</Text>
          <View style={styles.booking}><View><Text style={styles.bookingName}>Summer Music Festival</Text><Text style={styles.bookingDate}>June 15, 2026</Text></View><Badge style={styles.confirmed}>Confirmed</Badge></View>
          <View style={styles.booking}><View><Text style={styles.bookingName}>Private Wedding</Text><Text style={styles.bookingDate}>July 8, 2026</Text></View><Badge style={styles.pending}>Pending</Badge></View>
        </Card>

        <View style={styles.actions}>
          <Button variant="outline" style={styles.btn} onPress={() => navigate('artist-dashboard')}><Text style={styles.btnText}>Cancel</Text></Button>
          <Button style={[styles.btn, styles.primaryBtn]} onPress={() => navigate('artist-dashboard')}><Text style={styles.btnText}>Save Changes</Text></Button>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 24 },
  infoCard: { backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)', padding: 16, marginBottom: 24 },
  infoText: { color: '#fff', fontSize: 14 },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 24 },
  cardTitle: { color: '#fff', fontWeight: '600', marginBottom: 16 },
  booking: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  bookingName: { color: '#fff', fontWeight: '500' },
  bookingDate: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  confirmed: { backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 0 },
  pending: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 0 },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  btnText: { color: '#fff' },
});
