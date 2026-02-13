import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, Calendar, Users } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const mockContests = [
  { id: 1, title: 'Best Jazz Performance 2026', prize: '$10,000', deadline: 'March 31, 2026', participants: 234, image: 'photo-1511671782779-c97d3d27a1d4' },
  { id: 2, title: 'Rising Star Competition', prize: '$5,000', deadline: 'April 15, 2026', participants: 456, image: 'photo-1470229722913-7c0e2dbbafd3' },
];

interface Props { navigate: (screen: string) => void; }

export default function SubmitToContest({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Submit to Contest</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <View style={styles.infoRow}><Trophy size={24} color="#a855f7" /><View><Text style={styles.infoTitle}>Enter to Win</Text><Text style={styles.infoText}>Showcase your talent and compete for prizes.</Text></View></View>
        </Card>

        {mockContests.map((c) => (
          <Card key={c.id} style={styles.contestCard}>
            <View style={styles.contestImageWrap}>
              <Image source={{ uri: `https://images.unsplash.com/${c.image}?w=800&h=400&fit=crop` }} style={styles.contestImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', '#000']} style={StyleSheet.absoluteFill} />
              <Badge style={styles.prizeBadge}>${c.prize}</Badge>
            </View>
            <View style={styles.contestBody}>
              <Text style={styles.contestTitle}>{c.title}</Text>
              <View style={styles.contestMeta}><Calendar size={16} color="#a855f7" /><Text style={styles.contestMetaText}>Deadline: {c.deadline}</Text></View>
              <View style={styles.contestMeta}><Users size={16} color="#a855f7" /><Text style={styles.contestMetaText}>{c.participants} participants</Text></View>
              <View style={styles.contestActions}>
                <Button variant="outline" style={styles.contestBtn}><Text style={styles.btnText}>View Details</Text></Button>
                <Button style={[styles.contestBtn, styles.primaryBtn]} onPress={() => navigate('artist-dashboard')}><Text style={styles.btnText}>Submit Entry</Text></Button>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24 },
  infoCard: { backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)', padding: 16, marginBottom: 24 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoTitle: { color: '#fff', fontWeight: '600', marginBottom: 4 },
  infoText: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
  contestCard: { overflow: 'hidden', marginBottom: 24 },
  contestImageWrap: { height: 192, position: 'relative' },
  contestImage: { width: '100%', height: '100%' },
  prizeBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: '#eab308' },
  contestBody: { padding: 16 },
  contestTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  contestMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  contestMetaText: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  contestActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  contestBtn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  btnText: { color: '#fff' },
});
