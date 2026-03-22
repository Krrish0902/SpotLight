import React, { useState } from 'react';
import { View, Image, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Props { navigate: (screen: string, data?: any) => void; artist?: any; }

export default function RequestBooking({ navigate, artist }: Props) {
  const { appUser } = useAuth();
  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('');
  const [venue, setVenue] = useState('');
  const [budget, setBudget] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!appUser) {
      Alert.alert('Error', 'You must be logged in to request a booking');
      return;
    }

    if (!eventName.trim() || !venue.trim()) {
      Alert.alert('Error', 'Please fill in the event name and venue');
      return;
    }

    setLoading(true);
    try {
      // For now, we'll set the event_date to tomorrow if not specified, 
      // though a full implementation would use a date picker
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const { error } = await supabase
        .from('bookings')
        .insert({
          organizer_id: appUser.id,
          artist_id: artist?.user_id || artist?.id,
          event_date: tomorrow.toISOString(),
          status: 'pending',
          message: `Event: ${eventName}\nType: ${eventType}\nVenue: ${venue}\nBudget: ${budget}\n\nMessage: ${message}`,
          price: budget ? parseFloat(budget.replace(/[^0-9.]/g, '')) : null
        });

      if (error) throw error;

      Alert.alert('Success', 'Booking request sent successfully!', [
        { text: 'OK', onPress: () => navigate('organizer-dashboard') }
      ]);
    } catch (err: any) {
      console.error('Booking error:', err);
      Alert.alert('Error', err.message || 'Failed to send booking request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-profile', { selectedArtist: artist })}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Request Booking</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.artistCard}>
          <Image source={{ uri: artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.artistImg} />
          <View style={styles.artistInfo}>
            <Text style={styles.artistName}>{artist?.display_name || artist?.name || 'Maya Rivers'}</Text>
            <Text style={styles.artistGenre}>{Array.isArray(artist?.genres) ? artist.genres.join(' • ') : (artist?.genres || 'Jazz • Soul')}</Text>
          </View>
        </Card>

        <Card style={styles.formCard}>
          <View style={styles.field}>
            <Label>Event Name</Label>
            <Input value={eventName} onChangeText={setEventName} placeholder="e.g., Summer Music Festival" />
          </View>
          <View style={styles.field}>
            <Label>Event Type</Label>
            <Input value={eventType} onChangeText={setEventType} placeholder="e.g., Wedding, Corporate" />
          </View>
          <View style={styles.field}>
            <Label>Venue</Label>
            <Input value={venue} onChangeText={setVenue} placeholder="Event location" />
          </View>
          <View style={styles.field}>
            <Label>Budget Range</Label>
            <Input value={budget} onChangeText={setBudget} placeholder="e.g., 500" keyboardType="numeric" />
          </View>
        </Card>

        <Card style={styles.formCard}>
          <Label>Message to Artist</Label>
          <Textarea value={message} onChangeText={setMessage} placeholder="Tell the artist about your event..." />
        </Card>

        <View style={styles.actions}>
          <Button variant="outline" style={styles.btn} onPress={() => navigate('artist-profile', { selectedArtist: artist })}>
            <Text style={styles.btnText}>Cancel</Text>
          </Button>
          <Button style={[styles.btn, styles.primaryBtn]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Request</Text>}
          </Button>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 24 },
  artistCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 24 },
  artistImg: { width: 64, height: 64, borderRadius: 8 },
  artistInfo: { marginLeft: 16 },
  artistName: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  artistGenre: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, marginBottom: 24 },
  field: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  btn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  btnText: { color: '#fff', fontWeight: '600' },
});
