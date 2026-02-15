import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, Pressable, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Plus, Pencil, Trash2, Clock } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Calendar } from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Booking {
  booking_id: string;
  organizer_id: string;
  artist_id: string;
  event_date: string;
  status: string;
  price: number | null;
  message: string | null;
  source: 'booking';
}

interface ScheduleEntry {
  schedule_id: string;
  artist_id: string;
  schedule_date: string;
  title: string;
  notes: string | null;
  start_time: string | null;
  duration_minutes: number | null;
  venue: string | null;
  location_address: string | null;
  source: 'schedule';
}

type WorkItem = Booking | ScheduleEntry;

interface Props { navigate: (screen: string) => void; }

const WORK_DATE_COLOR = '#a855f7';
const SELECTED_COLOR = '#7e22ce';

export default function ManageAvailability({ navigate }: Props) {
  const { appUser } = useAuth();
  const artistId = appUser?.id;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<ScheduleEntry | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addNotes, setAddNotes] = useState('');
  const [addStartTime, setAddStartTime] = useState<Date | null>(null);
  const [addDuration, setAddDuration] = useState('');
  const [addVenue, setAddVenue] = useState('');
  const [addLocation, setAddLocation] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!artistId) return;
    setLoading(true);
    try {
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('artist_id', artistId)
        .in('status', ['accepted', 'completed', 'pending']);
      setBookings((bookingsData as Booking[]) || []);

      const { data: scheduleData } = await supabase
        .from('artist_schedule')
        .select('*')
        .eq('artist_id', artistId);
      setScheduleEntries((scheduleData as ScheduleEntry[]) || []);
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const getWorkDates = (): Record<string, { marked: boolean; dotColor: string }> => {
    const marked: Record<string, { marked: boolean; dotColor: string }> = {};
    bookings.forEach((b) => {
      const d = b.event_date.split('T')[0];
      marked[d] = { marked: true, dotColor: b.status === 'accepted' || b.status === 'completed' ? '#4ade80' : '#fb923c' };
    });
    scheduleEntries.forEach((s) => {
      const d = s.schedule_date;
      marked[d] = { marked: true, dotColor: WORK_DATE_COLOR };
    });
    return marked;
  };

  const markedDates = (): Record<string, object> => {
    const base = getWorkDates();
    if (selectedDate) {
      base[selectedDate] = { ...base[selectedDate], selected: true, selectedColor: SELECTED_COLOR };
    }
    return base;
  };

  const itemsForDate = (dateStr: string): WorkItem[] => {
    const bItems = bookings.filter((b) => {
      const d = b.event_date.split('T')[0];
      return d === dateStr;
    });
    const sItems = scheduleEntries.filter((s) => s.schedule_date === dateStr);
    return [...bItems, ...sItems];
  };

  const timeToStr = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`;

  const handleAddWork = async () => {
    if (!artistId || !selectedDate || !addTitle.trim()) {
      Alert.alert('Error', 'Please enter a title.');
      return;
    }
    setSaving(true);
    try {
      const dur = addDuration.trim() ? parseInt(addDuration, 10) : null;
      const { error } = await supabase.from('artist_schedule').insert({
        artist_id: artistId,
        schedule_date: selectedDate,
        title: addTitle.trim(),
        notes: addNotes.trim() || null,
        start_time: addStartTime ? timeToStr(addStartTime) : null,
        duration_minutes: dur && !isNaN(dur) ? dur : null,
        venue: addVenue.trim() || null,
        location_address: addLocation.trim() || null,
      });
      if (error) throw error;
      setAddTitle('');
      setAddNotes('');
      setAddStartTime(null);
      setAddDuration('');
      setAddVenue('');
      setAddLocation('');
      setShowAddModal(false);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to add.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSchedule = async (updates: {
    title: string;
    notes: string;
    startTime: Date | null;
    durationMinutes: number | null;
    venue: string;
    locationAddress: string;
  }) => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        title: updates.title.trim(),
        notes: updates.notes.trim() || null,
        start_time: updates.startTime ? timeToStr(updates.startTime) : null,
        duration_minutes: updates.durationMinutes,
        venue: updates.venue.trim() || null,
        location_address: updates.locationAddress.trim() || null,
      };
      const { error } = await supabase
        .from('artist_schedule')
        .update(payload)
        .eq('schedule_id', editItem!.schedule_id);
      if (error) throw error;
      setEditItem(null);
      fetchData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchedule = (item: ScheduleEntry) => {
    Alert.alert('Delete', 'Remove this work entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('artist_schedule').delete().eq('schedule_id', item.schedule_id);
            setEditItem(null);
            fetchData();
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to delete.');
          }
        },
      },
    ]);
  };

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Manage Availability</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoText}>
            Dates with dots indicate work or bookings. Tap a date to view and edit details.
          </Text>
        </Card>

        <View style={styles.calendarWrap}>
          <Calendar
            theme={{
              backgroundColor: 'rgba(17,24,39,0.5)',
              calendarBackground: 'rgba(17,24,39,0.5)',
              textSectionTitleColor: '#fff',
              selectedDayBackgroundColor: SELECTED_COLOR,
              selectedDayTextColor: '#fff',
              todayTextColor: '#a855f7',
              dayTextColor: '#fff',
              monthTextColor: '#fff',
              textDisabledColor: 'rgba(255,255,255,0.3)',
              arrowColor: '#a855f7',
            }}
            markedDates={markedDates()}
            onDayPress={(day) => setSelectedDate(day.dateString)}
          />
        </View>

        {selectedDate && (
          <Card style={styles.detailsCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
              <Button
                variant="outline"
                size="sm"
                onPress={() => {
                  setShowAddModal(true);
                  setAddTitle('');
                  setAddNotes('');
                  setAddStartTime(null);
                  setAddDuration('');
                  setAddVenue('');
                  setAddLocation('');
                }}
                style={styles.addBtn}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.addBtnText}>Add Work</Text>
              </Button>
            </View>

            {loading ? (
              <ActivityIndicator color="#a855f7" style={{ marginVertical: 24 }} />
            ) : (
              <>
                {itemsForDate(selectedDate).length === 0 ? (
                  <Text style={styles.emptyText}>No work or bookings on this date.</Text>
                ) : (
                  itemsForDate(selectedDate).map((item) => (
                    <View key={item.source === 'booking' ? item.booking_id : item.schedule_id} style={styles.itemRow}>
                      {item.source === 'booking' ? (
                        <>
                          <View style={styles.itemInfo}>
                            <Text style={styles.itemTitle}>Booking</Text>
                            <Text style={styles.itemMeta}>
                              {formatTime((item as Booking).event_date)} • {(item as Booking).status}
                            </Text>
                            {(item as Booking).message ? (
                              <Text style={styles.itemNotes}>{(item as Booking).message}</Text>
                            ) : null}
                          </View>
                          <Badge style={styles.statusBadge}>{(item as Booking).status}</Badge>
                        </>
                      ) : (
                        <>
                          {editItem?.schedule_id === item.schedule_id ? (
                            <EditScheduleForm
                              item={item as ScheduleEntry}
                              onSave={(updates) => handleUpdateSchedule(updates)}
                              onCancel={() => setEditItem(null)}
                              saving={saving}
                            />
                          ) : (
                            <>
                              <View style={styles.itemInfo}>
                                <Text style={styles.itemTitle}>{(item as ScheduleEntry).title}</Text>
                                <ScheduleMeta item={item as ScheduleEntry} />
                                {(item as ScheduleEntry).notes ? (
                                  <Text style={styles.itemNotes}>{(item as ScheduleEntry).notes}</Text>
                                ) : null}
                              </View>
                              <View style={styles.itemActions}>
                                <Button variant="ghost" size="icon" onPress={() => setEditItem(item as ScheduleEntry)}>
                                  <Pencil size={18} color="#a855f7" />
                                </Button>
                                <Button variant="ghost" size="icon" onPress={() => handleDeleteSchedule(item as ScheduleEntry)}>
                                  <Trash2 size={18} color="#f87171" />
                                </Button>
                              </View>
                            </>
                          )}
                        </>
                      )}
                    </View>
                  ))
                )}
              </>
            )}
          </Card>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      <Modal visible={showAddModal} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setShowAddModal(false)}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Add Work</Text>
              <Text style={styles.modalSubtitle}>Manual entry for {selectedDate}</Text>
              <Input
                placeholder="Title (e.g. Wedding Gig)"
                value={addTitle}
                onChangeText={setAddTitle}
                containerStyle={styles.modalInput}
              />
              <View style={styles.timeRow}>
                <Button
                  variant="outline"
                  onPress={() => setShowTimePicker((v) => !v)}
                  style={styles.timeBtn}
                >
                  <Clock size={18} color="#a855f7" />
                  <Text style={styles.timeBtnText}>
                    {addStartTime
                      ? addStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Set time'}
                  </Text>
                </Button>
                {showTimePicker && (
                  <DateTimePicker
                    value={addStartTime || new Date()}
                    mode="time"
                    onChange={(_, d) => {
                      if (Platform.OS === 'android') setShowTimePicker(false);
                      if (d) setAddStartTime(d);
                    }}
                  />
                )}
                <Input
                  placeholder="Duration (min)"
                  value={addDuration}
                  onChangeText={setAddDuration}
                  containerStyle={styles.durationInput}
                  keyboardType="numeric"
                />
              </View>
              <Input
                placeholder="Venue (optional)"
                value={addVenue}
                onChangeText={setAddVenue}
                containerStyle={styles.modalInput}
              />
              <Input
                placeholder="Address / location (optional)"
                value={addLocation}
                onChangeText={setAddLocation}
                containerStyle={styles.modalInput}
              />
              <Textarea
                placeholder="Notes (optional)"
                value={addNotes}
                onChangeText={setAddNotes}
                style={styles.modalTextarea}
              />
              <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setShowAddModal(false)} style={styles.modalBtn}>
                Cancel
              </Button>
              <Button onPress={handleAddWork} disabled={saving} style={styles.modalBtn}>
                {saving ? <ActivityIndicator color="#fff" /> : 'Add'}
              </Button>
            </View>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

function ScheduleMeta({ item }: { item: ScheduleEntry }) {
  const parts: string[] = [];
  if (item.start_time) {
    const t = item.start_time;
    const hhmm = t.length >= 5 ? t.slice(0, 5) : t;
    parts.push(hhmm);
  }
  if (item.duration_minutes != null) parts.push(`${item.duration_minutes} min`);
  if (item.venue) parts.push(item.venue);
  if (item.location_address) parts.push(item.location_address);
  if (parts.length === 0) return null;
  return <Text style={styles.itemMeta}>{parts.join(' • ')}</Text>;
}

function EditScheduleForm({
  item,
  onSave,
  onCancel,
  saving,
}: {
  item: ScheduleEntry;
  onSave: (updates: {
    title: string;
    notes: string;
    startTime: Date | null;
    durationMinutes: number | null;
    venue: string;
    locationAddress: string;
  }) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const parseTime = (t: string | null): Date | null => {
    if (!t) return null;
    const [h, m] = t.split(':').map(Number);
    const d = new Date();
    d.setHours(isNaN(h) ? 0 : h, isNaN(m) ? 0 : m, 0, 0);
    return d;
  };
  const [title, setTitle] = useState(item.title);
  const [notes, setNotes] = useState(item.notes || '');
  const [startTime, setStartTime] = useState<Date | null>(parseTime(item.start_time));
  const [duration, setDuration] = useState(item.duration_minutes != null ? String(item.duration_minutes) : '');
  const [venue, setVenue] = useState(item.venue || '');
  const [location, setLocation] = useState(item.location_address || '');
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    const dur = duration.trim() ? parseInt(duration, 10) : null;
    onSave({
      title,
      notes,
      startTime,
      durationMinutes: dur && !isNaN(dur) ? dur : null,
      venue,
      locationAddress: location,
    });
  };

  return (
    <View style={styles.editForm}>
      <Input placeholder="Title" value={title} onChangeText={setTitle} containerStyle={styles.editInput} />
      <View style={styles.timeRow}>
        <Button variant="outline" onPress={() => setShowTimePicker((v) => !v)} style={styles.editTimeBtn}>
          <Clock size={16} color="#a855f7" />
          <Text style={styles.timeBtnText}>
            {startTime ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Set time'}
          </Text>
        </Button>
        {showTimePicker && (
          <DateTimePicker
            value={startTime || new Date()}
            mode="time"
            onChange={(_, d) => {
              if (Platform.OS === 'android') setShowTimePicker(false);
              if (d) setStartTime(d);
            }}
          />
        )}
        <Input
          placeholder="Duration (min)"
          value={duration}
          onChangeText={setDuration}
          containerStyle={styles.editDurationInput}
          keyboardType="numeric"
        />
      </View>
      <Input placeholder="Venue" value={venue} onChangeText={setVenue} containerStyle={styles.editInput} />
      <Input placeholder="Address" value={location} onChangeText={setLocation} containerStyle={styles.editInput} />
      <Textarea placeholder="Notes" value={notes} onChangeText={setNotes} style={styles.editTextarea} />
      <View style={styles.editActions}>
        <Button variant="outline" size="sm" onPress={onCancel}>Cancel</Button>
        <Button size="sm" onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : 'Save'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24 },
  infoCard: { backgroundColor: 'rgba(147,51,234,0.2)', borderColor: 'rgba(168,85,247,0.3)', padding: 16, marginBottom: 24 },
  infoText: { color: '#fff', fontSize: 14 },
  calendarWrap: { marginBottom: 24, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(17,24,39,0.5)' },
  detailsCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  detailsTitle: { color: '#fff', fontWeight: '600', fontSize: 18 },
  addBtn: { flexDirection: 'row', gap: 6, borderColor: 'rgba(168,85,247,0.5)' },
  addBtnText: { color: '#fff', fontSize: 14 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginVertical: 8 },
  itemRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  itemInfo: { flex: 1 },
  itemTitle: { color: '#fff', fontWeight: '500' },
  itemMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
  itemNotes: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 4 },
  statusBadge: { backgroundColor: 'rgba(59,130,246,0.2)', borderWidth: 0 },
  editForm: { marginTop: 8 },
  editInput: { marginBottom: 12 },
  editTextarea: { minHeight: 60, marginBottom: 12 },
  editActions: { flexDirection: 'row', gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#111827', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  modalSubtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 14, marginBottom: 20 },
  modalScroll: { flex: 1 },
  modalScrollContent: { flexGrow: 1, justifyContent: 'flex-end' },
  modalInput: { marginBottom: 16 },
  modalTextarea: { minHeight: 80, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  timeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  timeBtnText: { color: '#a855f7', fontSize: 14 },
  durationInput: { width: 100 },
  editTimeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editDurationInput: { width: 90 },
});
