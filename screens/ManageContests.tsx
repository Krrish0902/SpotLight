import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Edit, Trash2, Trophy, Calendar, Users } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

const contests = [
  { id: 1, title: 'Best Jazz Performance 2026', prize: '$10,000', deadline: 'March 31, 2026', participants: 234, status: 'active', image: 'photo-1511671782779-c97d3d27a1d4' },
  { id: 2, title: 'Rising Star Competition', prize: '$5,000', deadline: 'April 15, 2026', participants: 456, status: 'active', image: 'photo-1470229722913-7c0e2dbbafd3' },
];

interface Props { navigate: (screen: string) => void; }

export default function ManageContests({ navigate }: Props) {
  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Contests</Text>
        <Button style={styles.createBtn}><Plus size={20} color="#fff" /><Text style={styles.createText}>Create</Text></Button>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {contests.map((c) => (
          <Card key={c.id} style={styles.contestCard}>
            <View style={styles.contestImageWrap}>
              <Image source={{ uri: `https://images.unsplash.com/${c.image}?w=800&h=400&fit=crop` }} style={styles.contestImage} />
              <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)', '#000']} style={StyleSheet.absoluteFill} />
              <View style={styles.badges}><Badge style={c.status === 'active' ? styles.activeBadge : styles.draftBadge}>{c.status}</Badge><Badge style={styles.prizeBadge} icon={<Trophy size={12} color="#000" />}>{c.prize}</Badge></View>
            </View>
            <View style={styles.contestBody}>
              <Text style={styles.contestTitle}>{c.title}</Text>
              <View style={styles.meta}><Calendar size={20} color="#a855f7" /><Text style={styles.metaText}>{c.deadline}</Text></View>
              <View style={styles.meta}><Users size={20} color="#a855f7" /><Text style={styles.metaText}>{c.participants} artists</Text></View>
              <View style={styles.actions}><Button variant="outline" size="sm" style={styles.actionBtn}><Edit size={16} color="#fff" /><Text style={styles.actionText}>Edit</Text></Button><Button variant="outline" size="sm" style={[styles.actionBtn, styles.deleteBtn]}><Trash2 size={16} color="#f87171" /><Text style={styles.deleteText}>Delete</Text></Button></View>
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
  contestCard: { marginBottom: 24, overflow: 'hidden' },
  contestImageWrap: { height: 192, position: 'relative' },
  contestImage: { width: '100%', height: '100%' },
  badges: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8 },
  activeBadge: { backgroundColor: '#22c55e', borderWidth: 0 },
  draftBadge: { backgroundColor: '#6b7280', borderWidth: 0 },
  prizeBadge: { backgroundColor: '#eab308' },
  contestBody: { padding: 24 },
  contestTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  metaText: { color: 'rgba(255,255,255,0.7)' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, borderColor: 'rgba(255,255,255,0.2)' },
  actionText: { color: '#fff' },
  deleteBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  deleteText: { color: '#f87171' },
});
