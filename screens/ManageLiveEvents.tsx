import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, MapPin, Calendar, Users, Edit, Trash2 } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const events = [
  { id: 1, title: 'Summer Music Festival 2026', venue: 'Central Park, NY', date: 'June 15-17, 2026', lineup: ['Maya Rivers', 'DJ Eclipse'], status: 'upcoming', image: 'photo-1470229722913-7c0e2dbbafd3' },
  { id: 2, title: 'Jazz Night Live', venue: 'Blue Note, NYC', date: 'July 8, 2026', lineup: ['Maya Rivers'], status: 'upcoming', image: 'photo-1511671782779-c97d3d27a1d4' },
];

interface Props { navigate: (screen: string) => void; }

export default function ManageLiveEvents({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Live Events</Text>
        <Button style={styles.createBtn}><Plus size={20} color="#fff" /><Text style={styles.createText}>Create</Text></Button>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {events.map((e) => (
          <Card key={e.id} style={styles.eventCard}>
            <View style={styles.eventRow}>
              <Image source={{ uri: `https://images.unsplash.com/${e.image}?w=600&h=400&fit=crop` }} style={styles.eventImg} />
              <View style={styles.eventInfo}>
                <Text style={styles.eventTitle}>{e.title}</Text>
                <View style={styles.meta}><Calendar size={16} color="#a855f7" /><Text style={styles.metaText}>{e.date}</Text></View>
                <View style={styles.meta}><MapPin size={16} color="#a855f7" /><Text style={styles.metaText}>{e.venue}</Text></View>
                <View style={styles.meta}><Users size={16} color="#a855f7" /><Text style={styles.metaText}>{e.lineup.length} artists</Text></View>
                <View style={styles.lineup}>{e.lineup.map((a, i) => <Badge key={i} variant="secondary" style={styles.lineupBadge}>{a}</Badge>)}</View>
                <View style={styles.actions}><Button variant="outline" size="sm" style={styles.actionBtn}><Edit size={14} color="#fff" /><Text style={styles.actionText}>Edit</Text></Button><Button variant="outline" size="sm" style={[styles.actionBtn, styles.delBtn]}><Trash2 size={14} color="#f87171" /><Text style={styles.delText}>Delete</Text></Button><Button size="sm" style={styles.viewBtn}><Text style={styles.viewText}>View</Text></Button></View>
              </View>
            </View>
          </Card>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', flex: 1 },
  createBtn: { backgroundColor: '#a855f7' },
  createText: { color: '#fff' },
  scroll: { padding: 24 },
  eventCard: { marginBottom: 24 },
  eventRow: { flexDirection: 'row' },
  eventImg: { width: 120, height: 160, borderRadius: 8 },
  eventInfo: { flex: 1, marginLeft: 24, paddingVertical: 8 },
  eventTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)' },
  lineup: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  lineupBadge: { backgroundColor: 'rgba(168,85,247,0.2)' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1 },
  actionText: { color: '#fff' },
  delBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  delText: { color: '#f87171' },
  viewBtn: { backgroundColor: '#a855f7' },
  viewText: { color: '#fff' },
});
