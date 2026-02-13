import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Share2 } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';

const mockEvent = {
  id: 1,
  title: 'Summer Music Festival 2026',
  date: 'June 15-17, 2026',
  venue: 'Central Park, New York',
  image: 'photo-1470229722913-7c0e2dbbafd3',
  lineup: [
    { id: 1, name: 'Maya Rivers', genre: 'Jazz • Soul', image: 'photo-1493225457124-a3eb161ffa5f' },
    { id: 2, name: 'The Neon Lights', genre: 'Indie Rock', image: 'photo-1516450360452-9312f5e86fc7' },
    { id: 3, name: 'DJ Eclipse', genre: 'Electronic', image: 'photo-1571609572760-64c0cd10b5ca' },
  ],
  description: 'Join us for three days of incredible music, featuring top artists from around the world. Experience unforgettable performances in the heart of New York City.',
};

interface Props {
  navigate: (screen: string, data?: any) => void;
  event?: typeof mockEvent;
}

export default function EventDetails({ navigate, event = mockEvent }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerImage}>
          <Image source={{ uri: `https://images.unsplash.com/${event.image}?w=800&h=600&fit=crop` }} style={styles.headerImg} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#000']} style={StyleSheet.absoluteFill} />
          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={() => navigate('public-home')}>
            <ChevronLeft size={24} color="#fff" />
          </Button>
          <Button variant="ghost" size="icon" style={styles.shareBtn} onPress={() => {}}>
            <Share2 size={24} color="#fff" />
          </Button>
        </View>

        <View style={styles.content}>
          <Card style={styles.eventCard}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.eventMeta}>
              <MapPin size={20} color="#a855f7" />
              <Text style={styles.metaText}>{event.date}</Text>
            </View>
            <View style={styles.eventMeta}>
              <MapPin size={20} color="#a855f7" />
              <Text style={styles.metaText}>{event.venue}</Text>
            </View>
            <Button style={styles.ticketBtn}>Get Tickets</Button>
          </Card>

          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description}</Text>

          <Text style={styles.sectionTitle}>Lineup</Text>
          {event.lineup.map((artist: any) => (
            <Card key={artist.id} onPress={() => navigate('artist-profile', { selectedArtist: artist })} style={styles.lineupCard}>
              <Image source={{ uri: `https://images.unsplash.com/${artist.image}?w=200&h=200&fit=crop` }} style={styles.lineupImg} />
              <View style={styles.lineupInfo}>
                <Text style={styles.lineupName}>{artist.name}</Text>
                <Text style={styles.lineupGenre}>{artist.genre}</Text>
              </View>
              <ChevronLeft size={20} color="rgba(255,255,255,0.4)" style={{ transform: [{ rotate: '180deg' }] }} />
            </Card>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="events" navigate={navigate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { paddingBottom: 120 },
  headerImage: { height: 320, position: 'relative' },
  headerImg: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  shareBtn: { position: 'absolute', top: 48, right: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  content: { padding: 24, marginTop: -32 },
  eventCard: {
    backgroundColor: 'rgba(17,24,39,0.9)',
    padding: 24,
    marginBottom: 24,
  },
  eventTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  ticketBtn: { backgroundColor: '#a855f7', marginTop: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  description: { color: 'rgba(255,255,255,0.7)', lineHeight: 24, marginBottom: 24 },
  lineupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    marginBottom: 12,
  },
  lineupImg: { width: 64, height: 64, borderRadius: 8 },
  lineupInfo: { flex: 1, marginLeft: 16 },
  lineupName: { color: '#fff', fontWeight: '600', fontSize: 16 },
  lineupGenre: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
});
