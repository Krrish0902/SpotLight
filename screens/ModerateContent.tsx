import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, Check, X, AlertCircle } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/Textarea';

const pendingVideos = [
  { id: 1, artist: 'Maya Rivers', title: 'Live Jazz Performance', thumbnail: 'photo-1493225457124-a3eb161ffa5f', duration: '3:24' },
  { id: 2, artist: 'DJ Eclipse', title: 'Electronic Set', thumbnail: 'photo-1571609572760-64c0cd10b5ca', duration: '5:12' },
];

interface Props { navigate: (screen: string) => void; }

export default function ModerateContent({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <View><Text style={styles.title}>Moderate Content</Text><Badge style={styles.pendingBadge}>{pendingVideos.length} Pending Review</Badge></View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {pendingVideos.map((v) => (
          <Card key={v.id} style={styles.videoCard}>
            <View style={styles.videoPreview}>
              <Image source={{ uri: `https://images.unsplash.com/${v.thumbnail}?w=400&h=700&fit=crop` }} style={styles.videoImg} />
              <View style={styles.playOverlay}><Play size={32} color="#fff" /></View>
              <Badge style={styles.durationBadge}>{v.duration}</Badge>
            </View>
            <View style={styles.videoDetails}>
              <Text style={styles.videoTitle}>{v.title}</Text>
              <Text style={styles.videoArtist}>by {v.artist}</Text>
              <Card style={styles.guidelinesCard}>
                <View style={styles.guidelinesHeader}><AlertCircle size={20} color="#60a5fa" /><Text style={styles.guidelinesTitle}>Content Guidelines Check</Text></View>
                <View style={styles.checkRow}><Check size={16} color="#4ade80" /><Text style={styles.checkText}>Appropriate content</Text></View>
                <View style={styles.checkRow}><Check size={16} color="#4ade80" /><Text style={styles.checkText}>Good video quality</Text></View>
              </Card>
              <Textarea placeholder="Rejection reason (if applicable)" style={styles.rejectInput} />
              <View style={styles.actions}>
                <Button variant="outline" style={[styles.actionBtn, styles.rejectBtn]} onPress={() => navigate('admin-dashboard')}><X size={20} color="#f87171" /><Text style={styles.rejectText}>Reject</Text></Button>
                <Button style={[styles.actionBtn, styles.approveBtn]} onPress={() => navigate('admin-dashboard')}><Check size={20} color="#fff" /><Text style={styles.approveText}>Approve</Text></Button>
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
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderWidth: 0, marginTop: 8 },
  scroll: { padding: 24 },
  videoCard: { marginBottom: 24 },
  videoPreview: { aspectRatio: 9/16, position: 'relative' },
  videoImg: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  durationBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)' },
  videoDetails: { padding: 24 },
  videoTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  videoArtist: { color: 'rgba(255,255,255,0.6)', marginBottom: 16 },
  guidelinesCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 16 },
  guidelinesHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  guidelinesTitle: { color: '#fff', fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  checkText: { color: '#4ade80', fontSize: 14 },
  rejectInput: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1 },
  rejectBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  rejectText: { color: '#f87171' },
  approveBtn: { backgroundColor: '#22c55e' },
  approveText: { color: '#fff' },
});
