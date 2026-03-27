import React, { useState, useEffect } from 'react';
import { View, Image, ScrollView, StyleSheet, ActivityIndicator, Pressable, TouchableOpacity } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Search, Bell, Settings, MapPin, CheckCircle2, Clock, X, ChevronDown, Ticket, Activity, AlertCircle, RefreshCw } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { MetricCard } from '../components/analytics/MetricCard';

interface OrganizerEvent {
  event_id: string;
  title: string;
  event_date: string;
  location_name: string | null;
  city: string | null;
  poster_url: string | null;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface Props { navigate: (screen: string, data?: any) => void; }

export default function OrganizerDashboard({ navigate }: Props) {
  const { profile, appUser } = useAuth();
  const displayName = profile?.display_name ?? appUser?.email?.split('@')[0] ?? 'Organizer';
  
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const {
    isLoading, error, period, setPeriod, refresh,
    selectedEventId, setSelectedEventId,
    salesVelocity, ticketTypeTrend, trafficSources,
    activeEventsCount, totalTickets
  } = useOrganizerAnalytics(appUser?.id || '');

  useEffect(() => {
    async function fetchEvents() {
      if (!appUser?.id) return;
      try {
        const { data, error } = await supabase
          .from('events')
          .select('event_id, title, event_date, location_name, city, poster_url, approval_status')
          .eq('organizer_id', appUser.id)
          .eq('is_deleted', false)
          .order('event_date', { ascending: false });
        if (error) throw error;
        setEvents(data ?? []);
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setEventsLoading(false);
      }
    }
    fetchEvents();
  }, [appUser?.id]);

  // Realtime: reflect admin approval/rejection without refresh
  useEffect(() => {
    if (!appUser?.id) return;
    const channel = supabase
      .channel(`org-events:${appUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (p) => {
        const row: any = (p.new || p.old) as any;
        if (!row) return;
        if (row.organizer_id !== appUser.id) return;
        // Re-fetch to keep ordering/filters correct
        (async () => {
          try {
            const { data } = await supabase
              .from('events')
              .select('event_id, title, event_date, location_name, city, poster_url, approval_status')
              .eq('organizer_id', appUser.id)
              .eq('is_deleted', false)
              .order('event_date', { ascending: false });
            setEvents((data as any) ?? []);
          } catch {}
        })();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appUser?.id]);

  // Transform ticket trend for area chart
  const ticketTrendSeries = React.useMemo(() => {
    if (!ticketTypeTrend || ticketTypeTrend.length === 0) return [];
    
    // Group by ticket_type
    const types = Array.from(new Set(ticketTypeTrend.map(t => t.ticket_type)));
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];
    
    return types.map((type, idx) => {
      const filtered = ticketTypeTrend.filter(t => t.ticket_type === type);
      const data = filtered.map(d => ({
        label: new Date(d.day).getDate().toString(),
        value: Number(d.count)
      }));
      return { type, data, color: colors[idx % colors.length] };
    });
  }, [ticketTypeTrend]);

  // Transform traffic sources for Donut PieChart
  const trafficData = React.useMemo(() => {
    if (!trafficSources || trafficSources.length === 0) return [];
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6'];
    return trafficSources.map((t, idx) => ({
      value: Number(t.view_count),
      text: `${t.pct_of_total}%`,
      color: colors[idx % colors.length],
      label: t.source
    }));
  }, [trafficSources]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A0F1E', '#0A0F1E']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        <View style={styles.header}>
          <View>
             <Text style={styles.title}>Dashboard</Text>
             <Text style={styles.subtitle}>Welcome back, {displayName}!</Text>
          </View>
          <View style={styles.headerBtns}>
            {isLoading && <ActivityIndicator size="small" color="#a855f7" style={{ marginRight: 4 }} />}
            <Button variant="ghost" size="icon" onPress={refresh}><RefreshCw size={20} color={isLoading ? '#a855f7' : '#fff'} /></Button>
            <Button variant="ghost" size="icon"><Bell size={24} color="#fff" /></Button>
            <Button variant="ghost" size="icon"><Settings size={24} color="#fff" /></Button>
          </View>
        </View>

        {/* Action Cards (Create Event, Find Artists) */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
          <Card style={[styles.actionCard, { flex: 1, backgroundColor: 'rgba(147,51,234,0.1)', borderColor: 'rgba(147,51,234,0.3)' }]} onPress={() => navigate('search-discover')}>
            <Search size={24} color="#d8b4fe" />
            <Text style={styles.actionCardText}>Find Artists</Text>
          </Card>
          <Card style={[styles.actionCard, { flex: 1, backgroundColor: 'rgba(168,85,247,0.1)', borderColor: 'rgba(168,85,247,0.3)' }]} onPress={() => navigate('create-event', { mode: 'create', event: null })}>
            <Calendar size={24} color="#c084fc" />
            <Text style={styles.actionCardText}>Create Event</Text>
          </Card>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>

        {error && (
          <Card style={{ backgroundColor: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <AlertCircle size={20} color="#F43F5E" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#F43F5E', fontWeight: '600', fontSize: 14 }}>Analytics failed to load</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 }}>{error}</Text>
            </View>
            <Button variant="ghost" size="icon" onPress={refresh}><RefreshCw size={16} color="#F43F5E" /></Button>
          </Card>
        )}

        {/* Period Selector */}
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 4, alignSelf: 'flex-start', marginBottom: 16 }}>
          {[7, 30, 60, 90].map(p => (
            <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 }, period === p && { backgroundColor: '#a855f7' }]}>
              <Text style={{ color: period === p ? '#fff' : 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' }}>{p}d</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Global Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
           <MetricCard label="Active Events" value={activeEventsCount} />
           <MetricCard label="Total Tickets Sold" value={totalTickets} />
           <MetricCard label="Total Revenue" value={(salesVelocity?.total_revenue_cents || 0) / 100} format="currency" />
        </ScrollView>

        {/* Live Sales Velocity */}
        <Text style={styles.sectionTitle}>Live Sales Velocity</Text>
        <Card style={styles.velocityCard}>
          <View style={styles.velocityHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
               <Activity size={20} color="#10B981" />
               <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textTransform: 'uppercase' }}>Live Polling Active</Text>
            </View>
          </View>
          <Text style={styles.velocityMainVal}>{Number(salesVelocity?.last_24h_count || 0)} <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }}>tickets sold in 24h</Text></Text>
          
          <View style={styles.velocitySubRow}>
             <View style={styles.velocitySubItem}>
               <Text style={styles.velocitySubLabel}>Last Hour</Text>
               <Text style={styles.velocitySubVal}>{Number(salesVelocity?.last_hour_count || 0)}</Text>
             </View>
             <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
             <View style={styles.velocitySubItem}>
               <Text style={styles.velocitySubLabel}>24h Revenue</Text>
               <Text style={styles.velocitySubVal}>${((salesVelocity?.last_24h_revenue_cents || 0) / 100).toLocaleString()}</Text>
             </View>
             <View style={{ width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' }} />
             <View style={styles.velocitySubItem}>
               <Text style={styles.velocitySubLabel}>Total Sold</Text>
               <Text style={styles.velocitySubVal}>{Number(salesVelocity?.total_count || 0).toLocaleString()}</Text>
             </View>
          </View>
        </Card>

        {/* Event Selector for deep dive */}
        <View style={styles.deepDiveHeader}>
          <Text style={styles.sectionTitle}>Deep Dive</Text>
          {events.length > 0 && (
            <Card style={styles.dropdownPicker}>
               <Text style={{ color: '#fff', fontSize: 12 }}>{selectedEventId ? events.find(e => e.event_id === selectedEventId)?.title : 'All Events'}</Text>
               <ChevronDown size={14} color="#fff" style={{ marginLeft: 8 }} />
            </Card>
          )}
        </View>

        {/* Ticket Type Stacked Area Chart */}
        <Text style={styles.chartSubtitle}>Sales by ticket type</Text>
        <Card style={styles.cardPad}>
           {ticketTrendSeries.length > 0 ? (
             <View>
               <LineChart 
                 data={ticketTrendSeries[0]?.data}
                 data2={ticketTrendSeries[1]?.data}
                 data3={ticketTrendSeries[2]?.data}
                 color1={ticketTrendSeries[0]?.color}
                 color2={ticketTrendSeries[1]?.color}
                 color3={ticketTrendSeries[2]?.color}
                 thickness={2}
                 height={180}
                 curved
                 areaChart
                 hideDataPoints
                 yAxisTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                 xAxisLabelTextStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}
                 startFillColor1={`${ticketTrendSeries[0]?.color}40`}
                 startFillColor2={`${ticketTrendSeries[1]?.color}40`}
                 startFillColor3={`${ticketTrendSeries[2]?.color}40`}
                 yAxisThickness={0}
                 xAxisThickness={0}
                 hideRules
               />
               <View style={styles.legend}>
                  {ticketTrendSeries.map((s, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendSwatch, { backgroundColor: s.color }]} />
                      <Text style={styles.legendLabelText}>{s.type}</Text>
                    </View>
                  ))}
               </View>
             </View>
           ) : (
             <View style={styles.emptyChart}><Text style={{ color: 'rgba(255,255,255,0.4)' }}>No ticket sales data available.</Text></View>
           )}
        </Card>

        {/* Traffic Sources Donut */}
        <Text style={styles.chartSubtitle}>Traffic Sources (Page Views)</Text>
        <Card style={[styles.cardPad, { alignItems: 'center' }]}>
           {trafficData.length > 0 ? (
             <View style={{ alignItems: 'center' }}>
               <PieChart
                 data={trafficData}
                 donut
                 innerRadius={60}
                 radius={90}
                 innerCircleColor="#111827"
                 centerLabelComponent={() => (
                   <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                     <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>{trafficData[0]?.value}</Text>
                     <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{trafficData[0]?.label}</Text>
                   </View>
                 )}
               />
               <View style={styles.legend}>
                  {trafficData.map((t, idx) => (
                    <View key={idx} style={styles.legendItem}>
                      <View style={[styles.legendSwatch, { backgroundColor: t.color }]} />
                      <Text style={styles.legendLabelText}>{t.label} ({t.text})</Text>
                    </View>
                  ))}
               </View>
             </View>
           ) : (
             <View style={styles.emptyChart}><Text style={{ color: 'rgba(255,255,255,0.4)' }}>No traffic data available.</Text></View>
           )}
        </Card>

        <Text style={styles.sectionTitle}>My Events</Text>
        {eventsLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}><ActivityIndicator size="large" color="#a855f7" /></View>
        ) : events.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 16 }}>You haven't created any events yet.</Text>
            <Button onPress={() => navigate('create-event', { mode: 'create', event: null })}>Create Event</Button>
          </Card>
        ) : (
          events.map((e) => (
            <Pressable key={e.event_id} onPress={() => navigate('event-details', { eventId: e.event_id })}>
              <Card style={styles.eventCard}>
                <Image source={{ uri: e.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop' }} style={styles.eventImg} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={2}>{e.title}</Text>
                  <View style={styles.eventMeta}>
                    <Calendar size={12} color="rgba(255,255,255,0.6)" />
                    <Text style={styles.eventDate}>{new Date(e.event_date).toLocaleDateString()}</Text>
                  </View>
                  {(e.location_name || e.city) && (
                    <View style={styles.eventMeta}>
                      <MapPin size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.eventLocation} numberOfLines={1}>{[e.location_name, e.city].filter(Boolean).join(', ')}</Text>
                    </View>
                  )}
                  {e.approval_status === 'pending' && <Badge icon={<Clock size={12} color="#fb923c" />} style={styles.pendingBadge}>Pending</Badge>}
                  {e.approval_status === 'approved' && <Badge icon={<CheckCircle2 size={12} color="#4ade80" />} style={styles.confirmedBadge}>Approved</Badge>}
                  {e.approval_status === 'rejected' && <Badge icon={<X size={12} color="#f87171" />} style={styles.declinedBadge}>Rejected</Badge>}
                </View>
              </Card>
            </Pressable>
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
      <BottomNav activeTab="home" navigate={navigate} userRole="organizer" isAuthenticated />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1E' },
  scroll: { padding: 20, paddingTop: 40, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  actionCard: { padding: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 12, gap: 8 },
  actionCardText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginTop: 16, marginBottom: 16 },
  chartSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8, marginBottom: 8 },
  velocityCard: { backgroundColor: '#111827', padding: 20, borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, marginBottom: 24, borderRadius: 12 },
  velocityHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  velocityMainVal: { fontSize: 40, fontFamily: 'Courier', color: '#fff', fontWeight: 'bold', marginBottom: 24 },
  velocitySubRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  velocitySubItem: { alignItems: 'center' },
  velocitySubLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  velocitySubVal: { color: '#fff', fontSize: 16, fontFamily: 'Courier', fontWeight: 'bold' },
  cardPad: { padding: 16, backgroundColor: '#111827', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, marginBottom: 24 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, marginTop: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 5 },
  legendLabelText: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  emptyChart: { height: 180, justifyContent: 'center', alignItems: 'center' },
  deepDiveHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownPicker: { paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20 },
  eventCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 0, marginBottom: 12, overflow: 'hidden', flexDirection: 'row' },
  eventImg: { width: 80, height: 80 },
  eventInfo: { flex: 1, padding: 12, justifyContent: 'center' },
  eventTitle: { color: '#fff', fontWeight: '600', fontSize: 16 },
  eventMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  eventDate: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  eventLocation: { color: 'rgba(255,255,255,0.6)', fontSize: 13 },
  pendingBadge: { backgroundColor: 'rgba(249,115,22,0.2)' },
  confirmedBadge: { backgroundColor: 'rgba(34,197,94,0.2)' },
  declinedBadge: { backgroundColor: 'rgba(239,68,68,0.2)' },
  emptyCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24, alignItems: 'center' }
});
