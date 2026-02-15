import React, { useState } from 'react';
import { View, Image, ScrollView, StyleSheet } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
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
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Profiles</Text>
      </View>

      <Input value={searchQuery} onChangeText={setSearchQuery} placeholder="Search users..." leftIcon={<Search size={20} color="rgba(255,255,255,0.4)" />} containerStyle={styles.search} />

      <View style={styles.stats}>
        <Card style={styles.statCard}><Text style={styles.statNum}>{users.length}</Text><Text style={styles.statLabel}>Total</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statNum}>{users.filter(u => u.role === 'artist').length}</Text><Text style={styles.statLabel}>Artists</Text></Card>
        <Card style={styles.statCard}><Text style={styles.statNum}>{users.filter(u => u.role === 'organizer').length}</Text><Text style={styles.statLabel}>Organizers</Text></Card>
      </View>

      <Tabs defaultValue="all" tabs={[{ value: 'all', label: 'All' }, { value: 'artists', label: 'Artists' }, { value: 'organizers', label: 'Organizers' }]}>
        {(tab) => (
          <ScrollView contentContainerStyle={styles.userList}>
            {users.filter(u => tab === 'all' || (tab === 'artists' && u.role === 'artist') || (tab === 'organizers' && u.role === 'organizer')).map((u) => (
              <Card key={u.id} style={styles.userCard}>
                <Image source={{ uri: `https://images.unsplash.com/${u.image}?w=200&h=200&fit=crop` }} style={styles.userImg} />
                <View style={styles.userInfo}>
                  <View style={styles.userHeader}><Text style={styles.userName}>{u.name}</Text>{u.role === 'artist' ? <Badge icon={<Music size={12} color="#c084fc" />} style={styles.roleBadge}>Artist</Badge> : <Badge icon={<Briefcase size={12} color="#fb923c" />} style={styles.orgBadge}>Organizer</Badge>}</View>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <Text style={styles.userJoin}>Joined {u.joinDate}</Text>
                  {u.status === 'active' ? <Badge icon={<CheckCircle size={12} color="#4ade80" />} style={styles.activeBadge}>Active</Badge> : <Badge icon={<Ban size={12} color="#f87171" />} style={styles.suspendedBadge}>Suspended</Badge>}
                  <View style={styles.userActions}><Button variant="outline" size="sm"><Edit size={14} color="#fff" /><Text style={styles.actionText}>Edit</Text></Button>{u.status === 'active' ? <Button variant="outline" size="sm" style={styles.suspendBtn}><Ban size={14} color="#f87171" /><Text style={styles.suspendText}>Suspend</Text></Button> : <Button size="sm" style={styles.activateBtn}><CheckCircle size={14} color="#fff" /><Text style={styles.activateText}>Activate</Text></Button>}</View>
                </View>
              </Card>
            ))}
          </ScrollView>
        )}
      </Tabs>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  search: { margin: 24, marginBottom: 16 },
  stats: { flexDirection: 'row', gap: 12, paddingHorizontal: 24, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  userList: { padding: 24 },
  userCard: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 16 },
  userImg: { width: 64, height: 64, borderRadius: 8 },
  userInfo: { flex: 1, marginLeft: 16 },
  userHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  roleBadge: { backgroundColor: 'rgba(168,85,247,0.2)' },
  orgBadge: { backgroundColor: 'rgba(249,115,22,0.2)' },
  userEmail: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  userJoin: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 8 },
  activeBadge: { backgroundColor: 'rgba(34,197,94,0.2)', alignSelf: 'flex-start' },
  suspendedBadge: { backgroundColor: 'rgba(239,68,68,0.2)', alignSelf: 'flex-start' },
  userActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionText: { color: '#fff' },
  suspendBtn: { borderColor: 'rgba(239,68,68,0.3)' },
  suspendText: { color: '#f87171' },
  activateBtn: { backgroundColor: '#22c55e' },
  activateText: { color: '#fff' },
});
