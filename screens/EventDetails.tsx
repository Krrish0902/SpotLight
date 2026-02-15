import React, { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator, Modal, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, MapPin, Share2, X, Minus, Plus } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

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
  event?: any;
  eventId?: string;
}

export default function EventDetails({ navigate, event: initialEvent, eventId }: Props) {
  const { appUser } = useAuth();
  const [event, setEvent] = useState<any>(initialEvent || (eventId ? null : mockEvent));
  const [loading, setLoading] = useState(false);

  // Booking State
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    // If we have an eventId but no full event data, fetch it
    if (eventId && (!event || !event.title)) {
      fetchEventDetails(eventId);
    } else if (initialEvent) {
      setEvent(initialEvent);
    }
  }, [eventId, initialEvent]);

  const fetchEventDetails = async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', id)
        .single();

      if (error) throw error;

      // Transform data to match UI expectations if needed
      // Map database fields to UI fields
      const mappedEvent = {
        ...data,
        id: data.event_id,
        date: new Date(data.event_date).toLocaleDateString(),
        venue: data.location_name + (data.city ? `, ${data.city}` : ''),
        image: data.poster_url, // Poster URL might need fallback if null in DB, handled in Image source
        lineup: mockEvent.lineup, // Placeholder as we don't have lineup in DB yet
        price: data.ticket_price,
        available: data.available_tickets,
        total: data.total_tickets,
      };
      setEvent(mappedEvent);
    } catch (error) {
      console.error("Error fetching event details:", error);
      // Fallback to mock on error or show alert
      setEvent(mockEvent);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('events-grid');
  };

  const getAvailabilityStatus = (available: number, total: number) => {
    if (available === 0) return { label: 'SOLD OUT', color: '#ef4444', disabled: true }; // Red
    if (total > 0 && available <= total * 0.2) return { label: 'FAST FILLING', color: '#f97316', disabled: false }; // Orange
    return { label: 'AVAILABLE', color: '#22c55e', disabled: false }; // Green
  };

  const incrementQty = () => {
    if (quantity < 5 && quantity < event.available) setQuantity(q => q + 1);
  };

  const decrementQty = () => {
    if (quantity > 1) setQuantity(q => q - 1);
  };

  const handleBooking = async () => {
    if (!appUser) {
      Alert.alert('Login Required', 'Please login to book tickets.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Login', onPress: () => navigate('login-signup', { returnTo: 'event-details' }) }
      ]);
      return;
    }

    if (quantity > event.available) {
      Alert.alert('Unavailable', `Only ${event.available} tickets left.`);
      return;
    }

    setBookingLoading(true);
    try {
      // 1. Insert into tickets
      const { error: ticketError } = await supabase.from('tickets').insert({
        user_id: appUser.id,
        event_id: event.id,
        quantity: quantity,
        total_amount: quantity * (event.price || 0),
      });

      if (ticketError) throw ticketError;

      // 2. Update events availability (Optimistic update on UI, but critical on DB)
      const newAvailable = event.available - quantity;
      const { error: eventError } = await supabase
        .from('events')
        .update({ available_tickets: newAvailable })
        .eq('event_id', event.id);

      if (eventError) {
        console.error("Event update failed", eventError);
        throw eventError;
      }

      Alert.alert('Success', 'Tickets booked successfully!', [
        {
          text: 'OK', onPress: () => {
            setModalVisible(false);
            fetchEventDetails(event.id); // Refresh UI
          }
        }
      ]);
    } catch (error: any) {
      Alert.alert('Booking Failed', error.message || 'Something went wrong.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff' }}>Event not found</Text>
        <Button onPress={handleBack} style={{ marginTop: 20 }}>Go Back</Button>
      </View>
    );
  }

  // Handle image source: if it starts with http, use uri, else use unsplash ID logic from mock
  const imageSource = event.image?.startsWith('http')
    ? { uri: event.image }
    : { uri: `https://images.unsplash.com/${event.image || mockEvent.image}?w=800&h=600&fit=crop` };

  const status = getAvailabilityStatus(event.available, event.total);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerImage}>
          <Image source={imageSource} style={styles.headerImg} />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#000']} style={StyleSheet.absoluteFill} />
          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={handleBack}>
            <ChevronLeft size={24} color="#fff" />
          </Button>
          <Button variant="ghost" size="icon" style={styles.shareBtn} onPress={() => { }}>
            <Share2 size={24} color="#fff" />
          </Button>
        </View>

        <View style={styles.content}>
          <Card style={styles.eventCard}>
            <View style={styles.titleRow}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: status.color }]}>
                <Text style={styles.statusText}>{status.label}</Text>
              </View>
            </View>

            <View style={styles.eventMeta}>
              <MapPin size={20} color="#a855f7" />
              <Text style={styles.metaText}>{event.date}</Text>
            </View>
            <View style={styles.eventMeta}>
              <MapPin size={20} color="#a855f7" />
              <Text style={styles.metaText}>{event.venue}</Text>
            </View>
            <View style={styles.eventMeta}>
              <Text style={[styles.metaText, { color: '#fbbf24', fontWeight: 'bold' }]}>
                {event.price ? `$${event.price}` : 'Free'}
              </Text>
            </View>

            <Button
              style={[styles.ticketBtn, status.disabled && styles.disabledBtn]}
              disabled={status.disabled}
              onPress={() => { setQuantity(1); setModalVisible(true); }}
            >
              {status.disabled ? 'Sold Out' : 'Get Tickets'}
            </Button>
          </Card>

          <Text style={styles.sectionTitle}>About This Event</Text>
          <Text style={styles.description}>{event.description}</Text>

          <Text style={styles.sectionTitle}>Lineup</Text>
          {event.lineup && event.lineup.map((artist: any) => (
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

      {/* Booking Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tickets</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.qtyContainer}>
              <Text style={styles.qtyLabel}>Quantity</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity onPress={decrementQty} style={styles.qtyBtn}>
                  <Minus size={20} color={quantity > 1 ? "#fff" : "#555"} />
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{quantity}</Text>
                <TouchableOpacity onPress={incrementQty} style={styles.qtyBtn}>
                  <Plus size={20} color={quantity < 5 && quantity < event.available ? "#fff" : "#555"} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>${(quantity * (event.price || 0)).toFixed(2)}</Text>
            </View>

            <Button
              onPress={handleBooking}
              disabled={bookingLoading}
              style={{ marginTop: 24, backgroundColor: '#a855f7' }}
            >
              {bookingLoading ? <ActivityIndicator color="#fff" /> : 'Confirm Booking'}
            </Button>
          </View>
        </View>
      </Modal>

      <BottomNav activeTab="events" navigate={navigate} userRole={appUser?.role} isAuthenticated={!!appUser} />
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
  ticketBtnText: { color: '#fff', fontWeight: '600' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  disabledBtn: { backgroundColor: '#374151', opacity: 0.7 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1f2937', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  qtyContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  qtyLabel: { color: '#fff', fontSize: 16 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#374151', padding: 8, borderRadius: 12 },
  qtyBtn: { padding: 4 },
  qtyValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 16 },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 16 },
  totalValue: { color: '#fbbf24', fontSize: 24, fontWeight: 'bold' },
});
