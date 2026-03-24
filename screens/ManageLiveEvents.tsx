import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable, Alert } from 'react-native';
import { Image } from 'expo-image';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, MapPin, Calendar, Users, Trash2, Check, X } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';

type EventStatus = 'pending' | 'approved' | 'rejected';
type EventFilter = 'all' | EventStatus;

interface LiveEvent {
  event_id: string;
  title: string;
  event_date: string;
  location_name: string | null;
  city: string | null;
  poster_url: string | null;
  lineup_artists: any;
  approval_status: EventStatus;
  is_deleted: boolean;
}

interface Props { navigate: (screen: string, data?: any) => void; }

export default function ManageLiveEvents({ navigate }: Props) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventFilter>('pending');

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('events')
        .select('event_id, title, event_date, location_name, city, poster_url, lineup_artists, approval_status, is_deleted')
        .eq('is_deleted', false)
        .order('event_date', { ascending: true });
      if (error) throw error;
      setEvents((data as LiveEvent[]) || []);
    } catch (e) {
      console.error('Failed to fetch live events:', e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const updateEventStatus = async (eventId: string, status: EventStatus) => {
    setActionLoadingId(eventId);
    try {
      const { error } = await supabase
        .from('events')
        .update({ approval_status: status })
        .eq('event_id', eventId);
      if (error) throw error;
      setEvents((prev) => prev.map((ev) => (ev.event_id === eventId ? { ...ev, approval_status: status } : ev)));
    } catch (e) {
      console.error('Failed to update event status:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const deleteEvent = async (eventId: string) => {
    setActionLoadingId(eventId);
    try {
      const { error } = await supabase
        .from('events')
        .update({ is_deleted: true })
        .eq('event_id', eventId);
      if (error) throw error;
      setEvents((prev) => prev.filter((ev) => ev.event_id !== eventId));
    } catch (e) {
      console.error('Failed to delete event:', e);
    } finally {
      setActionLoadingId(null);
    }
  };

  const visibleEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter((e) => e.approval_status === activeFilter);
  }, [events, activeFilter]);

  const pendingCount = events.filter((e) => e.approval_status === 'pending').length;

  const getLineupCount = (lineup: any) => {
    if (!lineup) return 0;
    if (Array.isArray(lineup)) return lineup.length;
    try {
      const parsed = JSON.parse(lineup);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const getStatusBadge = (status: EventStatus) => {
    if (status === 'approved') {
      return (
        <Badge style={styles.approvedBadge}>
          Approved
        </Badge>
      );
    }
    if (status === 'rejected') {
      return (
        <Badge style={styles.rejectedBadge}>
          Rejected
        </Badge>
      );
    }
    return (
      <Badge style={styles.pendingBadge}>
        Pending
      </Badge>
    );
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Review Events</Text>
          <Text style={styles.subtitle}>{pendingCount} pending approvals</Text>
        </View>
        <Button style={styles.createBtn} onPress={() => navigate('create-event', { mode: 'create', event: null })}>
          <Plus size={16} color="#162447" />
          <Text style={styles.createText}>Create</Text>
        </Button>
      </View>

      <View style={styles.filters}>
        {(['pending', 'approved', 'rejected', 'all'] as EventFilter[]).map((f) => (
          <Pressable key={f} style={[styles.filterChip, activeFilter === f && styles.filterChipActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : `${f.charAt(0).toUpperCase()}${f.slice(1)}`}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator size="large" color="#22D3EE" />
            <Text style={styles.stateText}>Loading events...</Text>
          </View>
        ) : visibleEvents.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No events in this filter</Text>
            <Text style={styles.emptyDesc}>Create a new event or switch filters to review existing ones.</Text>
          </Card>
        ) : (
          visibleEvents.map((e) => (
            <Pressable key={e.event_id} onPress={() => navigate('event-details', { eventId: e.event_id })}>
              <Card style={styles.eventCard}>
                <Image
                  source={{ uri: e.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=500&fit=crop' }}
                  style={styles.eventImg}
                  contentFit="cover"
                />
                <View style={styles.eventInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.eventTitle} numberOfLines={2}>{e.title || 'Untitled Event'}</Text>
                    {getStatusBadge(e.approval_status)}
                  </View>
                  <View style={styles.meta}><Calendar size={14} color="#22D3EE" /><Text style={styles.metaText}>{new Date(e.event_date).toLocaleDateString()}</Text></View>
                  <View style={styles.meta}><MapPin size={14} color="#22D3EE" /><Text style={styles.metaText} numberOfLines={1}>{[e.location_name, e.city].filter(Boolean).join(', ') || 'Location not set'}</Text></View>
                  <View style={styles.meta}><Users size={14} color="#22D3EE" /><Text style={styles.metaText}>{getLineupCount(e.lineup_artists)} artists in lineup</Text></View>

                  <View style={styles.actions}>
                    {e.approval_status === 'pending' ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          style={[styles.actionBtn, styles.rejectBtn]}
                          onPress={() => updateEventStatus(e.event_id, 'rejected')}
                          disabled={actionLoadingId === e.event_id}
                        >
                          <X size={14} color="#f87171" />
                          <Text style={styles.rejectText}>Reject</Text>
                        </Button>
                        <Button
                          size="sm"
                          style={[styles.actionBtn, styles.approveBtn]}
                          onPress={() => updateEventStatus(e.event_id, 'approved')}
                          disabled={actionLoadingId === e.event_id}
                        >
                          <Check size={14} color="#162447" />
                          <Text style={styles.approveText}>Approve</Text>
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        style={[styles.actionBtn, styles.delBtn]}
                        disabled={actionLoadingId === e.event_id}
                        onPress={() =>
                          Alert.alert(
                            'Delete event',
                            'This will remove the event from listings.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: () => deleteEvent(e.event_id) },
                            ]
                          )
                        }
                      >
                        <Trash2 size={14} color="#f87171" />
                        <Text style={styles.delText}>Delete</Text>
                      </Button>
                    )}
                  </View>
                </View>
              </Card>
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 66, paddingBottom: 14 },
  title: { fontSize: 34, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 2, fontSize: 14 },
  createBtn: { backgroundColor: '#FDF2FF', borderRadius: 999, minHeight: 38, paddingHorizontal: 14 },
  createText: { color: '#162447', fontWeight: '800' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, marginBottom: 12 },
  filterChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  filterChipActive: {
    backgroundColor: 'rgba(34,211,238,0.18)',
    borderColor: 'rgba(34,211,238,0.42)',
  },
  filterText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#CFFAFE' },
  scroll: { paddingHorizontal: 18, paddingBottom: 100 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 10 },
  stateText: { color: 'rgba(255,255,255,0.65)' },
  emptyCard: {
    marginTop: 6,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: 'rgba(255,255,255,0.62)', marginTop: 6, lineHeight: 20 },
  eventCard: {
    marginBottom: 12,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventImg: { width: '100%', height: 160 },
  eventInfo: { padding: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  eventTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: -0.3 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 },
  metaText: { color: 'rgba(255,255,255,0.78)', fontSize: 14 },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderColor: 'rgba(251,146,60,0.45)', borderWidth: StyleSheet.hairlineWidth },
  approvedBadge: { backgroundColor: 'rgba(16,185,129,0.18)', borderColor: 'rgba(16,185,129,0.45)', borderWidth: StyleSheet.hairlineWidth },
  rejectedBadge: { backgroundColor: 'rgba(248,113,113,0.16)', borderColor: 'rgba(248,113,113,0.4)', borderWidth: StyleSheet.hairlineWidth },
  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, minHeight: 36 },
  rejectBtn: { borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(248,113,113,0.08)' },
  rejectText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
  approveBtn: { backgroundColor: '#FDF2FF' },
  approveText: { color: '#162447', fontSize: 13, fontWeight: '800' },
  delBtn: { borderColor: 'rgba(248,113,113,0.35)', backgroundColor: 'rgba(248,113,113,0.08)' },
  delText: { color: '#FCA5A5', fontSize: 13, fontWeight: '700' },
});
