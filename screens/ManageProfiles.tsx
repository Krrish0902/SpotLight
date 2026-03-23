import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text } from '../components/ui/Text';
import { ChevronLeft, Search, Edit, Ban, CheckCircle, Music, Briefcase } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';

const users = [
  { id: 1, name: 'Maya Rivers', email: 'maya@example.com', role: 'artist', status: 'active', joinDate: 'Jan 15, 2026', image: 'photo-1493225457124-a3eb161ffa5f', stats: { views: 2847, bookings: 23 } },
  { id: 2, name: 'John Smith', email: 'john@example.com', role: 'organizer', status: 'active', joinDate: 'Jan 20, 2026', image: 'photo-1535713875002-d1d0cf377fde', stats: { events: 12, bookings: 8 } },
  { id: 3, name: 'DJ Eclipse', email: 'djeclipse@example.com', role: 'artist', status: 'suspended', joinDate: 'Dec 10, 2025', image: 'photo-1571609572760-64c0cd10b5ca', stats: { views: 8921, bookings: 45 } },
];

interface Props { navigate: (screen: string) => void; }

export default function ManageProfiles({ navigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Profiles</Text>
      </View>

      <Input value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." leftIcon={<Search size={20} color="rgba(255,255,255,0.4)" />} containerStyle={styles.search} />

      <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.stats}>
        <View style={styles.statCard}><Text style={styles.statNum}>{users.length}</Text><Text style={styles.statLabel}>Total</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{users.filter(u => u.role === 'artist').length}</Text><Text style={styles.statLabel}>Artists</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{users.filter(u => u.role === 'organizer').length}</Text><Text style={styles.statLabel}>Organizers</Text></View>
      </Animated.View>

      <Tabs defaultValue="all" tabs={[{ value: 'all', label: 'All' }, { value: 'artists', label: 'Artists' }, { value: 'organizers', label: 'Organizers' }]}>
        {(tab) => (
          <ScrollView contentContainerStyle={styles.userList}>
            {users.filter(u => tab === 'all' || (tab === 'artists' && u.role === 'artist') || (tab === 'organizers' && u.role === 'organizer')).map((u, i) => (
              <Animated.View key={u.id} entering={FadeInDown.delay(150 + i * 50).springify()}>
                <View style={styles.userCard}>
                  <Image source={{ uri: `https://images.unsplash.com/${u.image}?w=200&h=200&fit=crop` }} style={styles.userImg} />
                  <View style={styles.userInfo}>
                    <View style={styles.userHeader}><Text style={styles.userName}>{u.name}</Text>{u.role === 'artist' ? <Badge icon={<Music size={12} color="#c084fc" />} style={styles.roleBadge}>Artist</Badge> : <Badge icon={<Briefcase size={12} color="#fb923c" />} style={styles.orgBadge}>Organizer</Badge>}</View>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <Text style={styles.userJoin}>Joined {u.joinDate}</Text>
                    {u.status === 'active' ? <Badge icon={<CheckCircle size={12} color="#4ade80" />} style={styles.activeBadge}>Active</Badge> : <Badge icon={<Ban size={12} color="#f87171" />} style={styles.suspendedBadge}>Suspended</Badge>}
                    <View style={styles.userActions}><Button variant="outline" size="sm"><Edit size={14} color="#fff" /><Text style={styles.actionText}>Edit</Text></Button>{u.status === 'active' ? <Button variant="outline" size="sm" style={styles.suspendBtn}><Ban size={14} color="#f87171" /><Text style={styles.suspendText}>Suspend</Text></Button> : <Button size="sm" style={styles.activateBtn}><CheckCircle size={14} color="#fff" /><Text style={styles.activateText}>Activate</Text></Button>}</View>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 64, paddingBottom: 16 },
  title: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  search: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 24, paddingVertical: 16, marginHorizontal: 16, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', color: '#ffffff' },
  stats: { flexDirection: 'row', gap: 16, paddingHorizontal: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 24, borderRadius: 32, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  statLabel: { color: '#8E8E93', fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4 },
  userList: { padding: 16, gap: 16, paddingBottom: 100 },
  userCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  userImg: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.1)' },
  userInfo: { flex: 1 },
  userHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginBottom: 8 },
  userName: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  orgBadge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  userMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  userMetaText: { color: '#8E8E93', fontSize: 15, fontWeight: '500' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { flex: 1, minWidth: 100, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  suspendBtn: { flex: 1, minWidth: 100, backgroundColor: 'rgba(255,59,48,0.15)', borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  suspendText: { color: '#FF3B30', fontSize: 15, fontWeight: '700' },
  activateBtn: { flex: 1, minWidth: 100, backgroundColor: 'rgba(253,242,255,0.15)', borderRadius: 100, paddingVertical: 14, alignItems: 'center' },
  activateText: { color: '#FDF2FF', fontSize: 15, fontWeight: '700' },
  userEmail: { color: '#8E8E93', fontSize: 14 },
  userJoin: { color: '#8E8E93', fontSize: 13 },
  activeBadge: { backgroundColor: 'rgba(253,242,255,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  suspendedBadge: { backgroundColor: 'rgba(255,59,48,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  userActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
});