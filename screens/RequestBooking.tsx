import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';

interface Props { navigate: (screen: string, data?: any) => void; artist?: any; }

export default function RequestBooking({ navigate, artist }: Props) {
  const [message, setMessage] = useState('');

  const handleSubmit = () => navigate('organizer-dashboard');

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-profile', { selectedArtist: artist })}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Request Booking</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.artistCard}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.artistImg} />
          <View style={styles.artistInfo}><Text style={styles.artistName}>{artist?.name || 'Maya Rivers'}</Text><Text style={styles.artistGenre}>Jazz • Soul</Text></View>
        </Card>

        <Card style={styles.formCard}>
          <View style={styles.field}><Label>Event Name</Label><Input placeholder="e.g., Summer Music Festival" /></View>
          <View style={styles.field}><Label>Event Type</Label><Input placeholder="e.g., Wedding, Corporate" /></View>
          <View style={styles.field}><Label>Venue</Label><Input placeholder="Event location" /></View>
          <View style={styles.field}><Label>Budget Range</Label><Input placeholder="e.g., $500 - $1000" /></View>
        </Card>

        <Card style={styles.formCard}>
          <Label>Message to Artist</Label>
          <Textarea value={message} onChangeText={setMessage} placeholder="Tell the artist about your event..." />
        </Card>

        <View style={styles.actions}>
          <Button variant="outline" style={styles.btn} onPress={() => navigate('artist-profile', { selectedArtist: artist })}><Text style={styles.btnText}>Cancel</Text></Button>
          <Button style={[styles.btn, styles.primaryBtn]} onPress={handleSubmit}><Text style={styles.btnText}>Send Request</Text></Button>
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
  artistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 24 },
  artistImg: { width: 64, height: 64, borderRadius: 8 },
  artistInfo: { marginLeft: 16 },
  artistName: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  artistGenre: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 24 },
  field: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  btnText: { color: '#fff' },
});
