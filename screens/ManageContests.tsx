import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  Plus,
  X,
  Calendar,
  Trophy,
  Users,
  Upload,
} from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Textarea } from '../components/ui/Textarea';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Props {
  navigate: (screen: string, data?: any) => void;
}

type ContestRow = {
  contest_id: string;
  title: string;
  poster_url?: string | null;
  description?: string | null;
  rules?: string | null;
  prize?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
};

const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';

function toInputTimestamp(d: Date) {
  // Postgres "timestamp without time zone" expects a local-ish string.
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

async function uriToBase64FileData(uri: string): Promise<ArrayBuffer> {
  // Matches CreateEventScreen logic: read file as base64, then convert to ArrayBuffer.
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

export default function ManageContests({ navigate }: Props) {
  const { appUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [contests, setContests] = useState<ContestRow[]>([]);
  const [participantsByContestId, setParticipantsByContestId] = useState<Record<string, number>>({});

  const [createOpen, setCreateOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [prize, setPrize] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [posterUri, setPosterUri] = useState<string | null>(null);
  const [posterUploading, setPosterUploading] = useState(false);

  const canCreate = !!appUser && appUser.role === 'admin';

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setRules('');
    setPrize('');
    setIsActive(true);
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setShowStartPicker(false);
    setShowEndPicker(false);
    setPosterUri(null);
    setPosterUploading(false);
  };

  const loadContests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_list_contests');
      if (error) throw error;

      const list = (data || []) as ContestRow[];
      setContests(list);

      // Compute participant count = unique artists who submitted.
      const ids = list.map((c) => c.contest_id).filter(Boolean);
      if (ids.length === 0) {
        setParticipantsByContestId({});
        return;
      }

      const { data: submissions } = await supabase
        .from('contest_submissions')
        .select('contest_id, artist_id')
        .in('contest_id', ids as any);

      const map: Record<string, Set<string>> = {};
      (submissions || []).forEach((s: any) => {
        const cid = String(s.contest_id || '');
        const aid = String(s.artist_id || '');
        if (!cid || !aid) return;
        map[cid] = map[cid] || new Set<string>();
        map[cid].add(aid);
      });

      const out: Record<string, number> = {};
      Object.keys(map).forEach((cid) => {
        out[cid] = map[cid].size;
      });
      setParticipantsByContestId(out);
    } catch (e) {
      console.error('Failed to load contests:', e);
      setContests([]);
      setParticipantsByContestId({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickPoster = async () => {
    if (posterUploading) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.85,
      });

      if (!result.canceled) {
        setPosterUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('Poster pick failed', e);
      Alert.alert('Error', e?.message || 'Failed to pick poster.');
    }
  };

  const uploadPoster = async (uri: string) => {
    if (!appUser?.id) throw new Error('Missing user id');
    setPosterUploading(true);
    try {
      const fileExt = uri.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${appUser.id}/${fileName}`;

      let fileData: ArrayBuffer | Blob;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        fileData = await response.blob();
      } else {
        fileData = await uriToBase64FileData(uri);
      }

      const { error: uploadError } = await supabase.storage
        .from('contest-posters')
        .upload(filePath, fileData as any, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('contest-posters')
        .getPublicUrl(filePath);
      return (publicData as any)?.publicUrl as string | undefined;
    } finally {
      setPosterUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!canCreate) {
      Alert.alert('Not allowed', 'Only admins can create contests.');
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDesc = description.trim();
    const trimmedRules = rules.trim();
    const trimmedPrize = prize.trim();
    if (!trimmedTitle || !trimmedDesc || !trimmedRules || !trimmedPrize) {
      Alert.alert('Missing fields', 'Please fill title, description, rules, and prize.');
      return;
    }
    if (!posterUri) {
      Alert.alert('Poster required', 'Please upload a contest poster image.');
      return;
    }

    if (endDate.getTime() < startDate.getTime()) {
      Alert.alert('Invalid dates', 'End date must be after start date.');
      return;
    }

    if (!appUser?.id) return;

    setSubmitting(true);
    try {
      const posterUrl = await uploadPoster(posterUri);
      if (!posterUrl) throw new Error('Poster upload failed.');

      const res = await supabase.rpc('admin_create_contest', {
        p_title: trimmedTitle,
        p_description: trimmedDesc,
        p_rules: trimmedRules,
        p_prize: trimmedPrize,
        p_poster_url: posterUrl,
        p_start_date: toInputTimestamp(startDate),
        p_end_date: toInputTimestamp(endDate),
        p_is_active: isActive,
      });

      if (res.error) throw res.error;

      setCreateOpen(false);
      resetForm();
      await loadContests();
      Alert.alert('Contest created', 'Your contest is live and will appear on Discover.');
    } catch (e: any) {
      console.error('Create contest failed', e);
      Alert.alert('Error', e?.message || 'Could not create contest.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeCountLabel = useMemo(() => {
    const active = contests.filter((c) => c.is_active).length;
    return `${active} active`;
  }, [contests]);

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Manage Contests</Text>
          <Text style={styles.subtitle}>{activeCountLabel}</Text>
        </View>
        {canCreate ? (
          <Button
            onPress={() => {
              resetForm();
              setCreateOpen(true);
            }}
            style={styles.createBtn}
          >
            <Plus size={20} color="#fff" />
            <Text style={styles.createText}>Create</Text>
          </Button>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#22D3EE" />
          </View>
        ) : contests.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No contests</Text>
            <Text style={styles.emptyText}>Create your first contest to appear on Discover.</Text>
          </View>
        ) : (
          contests.map((c) => (
            <Card key={c.contest_id} style={styles.contestCard}>
              <View style={styles.contestImageWrap}>
                <Image
                  source={{ uri: c.poster_url || DEFAULT_POSTER }}
                  style={styles.contestImage}
                  resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)', '#000']} style={StyleSheet.absoluteFill} />
                <View style={styles.badges}>
                  <Badge
                    style={c.is_active ? styles.activeBadge : styles.draftBadge}
                  >
                    {c.is_active ? 'active' : 'draft'}
                  </Badge>
                  {c.prize ? (
                    <Badge style={styles.prizeBadge} icon={<Trophy size={12} color="#000" />}>
                      {c.prize}
                    </Badge>
                  ) : null}
                </View>
              </View>
              <View style={styles.contestBody}>
                <Text style={styles.contestTitle}>{c.title}</Text>
                <View style={styles.meta}>
                  <Calendar size={18} color="#22D3EE" />
                  <Text style={styles.metaText}>
                    {c.end_date ? new Date(c.end_date).toLocaleDateString() : '—'}
                  </Text>
                </View>
                <View style={styles.meta}>
                  <Users size={18} color="#22D3EE" />
                  <Text style={styles.metaText}>
                    {participantsByContestId[c.contest_id] ?? 0} participants
                  </Text>
                </View>

                {!!c.description ? (
                  <Text style={styles.previewText} numberOfLines={3}>
                    {c.description}
                  </Text>
                ) : null}
                {!!c.rules ? (
                  <Text style={styles.previewText} numberOfLines={2}>
                    <Text style={styles.rulesLabel}>Rules: </Text>
                    {c.rules}
                  </Text>
                ) : null}
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      <Modal visible={createOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setCreateOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => (e as any).stopPropagation?.()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create contest</Text>
              <Pressable onPress={() => setCreateOpen(false)} hitSlop={12} style={styles.modalCloseBtn}>
                <X size={18} color="#fff" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Poster</Text>
                <Pressable onPress={pickPoster} style={styles.posterUpload} disabled={posterUploading || submitting}>
                  {posterUri ? (
                    <>
                      <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="cover" />
                      <View style={styles.posterRemoveOverlay}>
                        <Pressable onPress={() => setPosterUri(null)} hitSlop={10} style={styles.posterRemoveBtn}>
                          <X size={18} color="#fff" />
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <View style={styles.uploadPlaceholder}>
                      <Upload size={28} color="rgba(255,255,255,0.45)" />
                      <Text style={styles.uploadText}>Upload poster</Text>
                    </View>
                  )}
                </Pressable>
              </View>

              <View style={styles.formSection}>
                <Label>Title</Label>
                <Input placeholder="e.g. Summer Jazz Challenge" value={title} onChangeText={setTitle} editable={!submitting} />
              </View>

              <View style={styles.formSection}>
                <Label>Description</Label>
                <Textarea placeholder="What is this contest about?" value={description} onChangeText={setDescription} editable={!submitting} />
              </View>

              <View style={styles.formSection}>
                <Label>Rules</Label>
                <Textarea placeholder="How should artists enter? Any constraints?" value={rules} onChangeText={setRules} editable={!submitting} />
              </View>

              <View style={styles.formSection}>
                <Label>Prize</Label>
                <Input placeholder="$10,000" value={prize} onChangeText={setPrize} editable={!submitting} />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Dates</Text>

                <View style={styles.dateRow}>
                  <View style={styles.dateField}>
                    <Label>Start</Label>
                    <Pressable
                      style={styles.datePickerBtn}
                      onPress={() => {
                        setShowStartPicker(true);
                        setShowEndPicker(false);
                      }}
                      disabled={submitting}
                    >
                      <Calendar size={18} color="rgba(255,255,255,0.65)" />
                      <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                    </Pressable>
                    {showStartPicker && (
                      <DateTimePicker
                        value={startDate}
                        mode="date"
                        display="default"
                        onChange={(_, d) => {
                          setShowStartPicker(false);
                          if (d) setStartDate(d);
                        }}
                      />
                    )}
                  </View>

                  <View style={styles.dateField}>
                    <Label>End</Label>
                    <Pressable
                      style={styles.datePickerBtn}
                      onPress={() => {
                        setShowEndPicker(true);
                        setShowStartPicker(false);
                      }}
                      disabled={submitting}
                    >
                      <Calendar size={18} color="rgba(255,255,255,0.65)" />
                      <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                    </Pressable>
                    {showEndPicker && (
                      <DateTimePicker
                        value={endDate}
                        mode="date"
                        display="default"
                        onChange={(_, d) => {
                          setShowEndPicker(false);
                          if (d) setEndDate(d);
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.sectionLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    style={styles.statusBtn}
                    onPress={() => setIsActive(true)}
                    disabled={submitting}
                  >
                    <Text style={styles.statusBtnText}>Active</Text>
                  </Button>
                  <Button
                    variant={!isActive ? 'default' : 'outline'}
                    style={styles.statusBtn}
                    onPress={() => setIsActive(false)}
                    disabled={submitting}
                  >
                    <Text style={styles.statusBtnText}>Draft</Text>
                  </Button>
                </View>
              </View>

              <View style={styles.modalActions}>
                <Button variant="outline" onPress={() => setCreateOpen(false)} style={styles.modalBtn} disabled={submitting}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </Button>
                <Button onPress={handleCreate} style={styles.modalPrimaryBtn} disabled={submitting || posterUploading}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Create contest</Text>}
                </Button>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  subtitle: { color: 'rgba(255,255,255,0.6)', marginTop: 2, fontSize: 13 },
  createBtn: { backgroundColor: '#22D3EE', flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 14, borderRadius: 100 },
  createText: { color: '#0A2A33', fontWeight: '700' },
  scroll: { padding: 20 },

  loadingWrap: { paddingTop: 44, alignItems: 'center' },
  emptyWrap: { paddingTop: 64, alignItems: 'center' },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptyText: { color: 'rgba(255,255,255,0.6)', marginTop: 6, textAlign: 'center', maxWidth: 320 },

  contestCard: { marginBottom: 20, overflow: 'hidden' },
  contestImageWrap: { height: 250, position: 'relative' },
  contestImage: { width: '100%', height: '100%' },
  badges: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  activeBadge: { backgroundColor: '#22c55e', borderWidth: 0 },
  draftBadge: { backgroundColor: '#6b7280', borderWidth: 0 },
  prizeBadge: { backgroundColor: '#eab308' },
  contestBody: { padding: 18 },
  contestTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  metaText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },
  previewText: { color: 'rgba(255,255,255,0.72)', marginTop: 8 },
  rulesLabel: { color: 'rgba(255,255,255,0.9)', fontWeight: '700' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: '#030712',
    borderRadius: 18,
    padding: 14,
    maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },

  formSection: { marginTop: 10, marginBottom: 10 },
  sectionLabel: { color: '#fff', fontWeight: '800', marginBottom: 8, fontSize: 14 },

  posterUpload: {
    width: '100%',
    height: 240,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  posterImage: { width: '100%', height: '100%' },
  posterRemoveOverlay: { position: 'absolute', top: 10, right: 10 },
  posterRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  uploadPlaceholder: { alignItems: 'center', justifyContent: 'center', gap: 10 },
  uploadText: { color: 'rgba(255,255,255,0.7)', fontWeight: '700' },

  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1 },
  datePickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  dateText: { color: '#fff', fontWeight: '700', flex: 1 },

  statusRow: { flexDirection: 'row', gap: 10 },
  statusBtn: { flex: 1, justifyContent: 'center' },
  statusBtnText: { color: '#fff', fontWeight: '800' },

  modalActions: { flexDirection: 'row', gap: 10, marginTop: 14, marginBottom: 10 },
  modalBtn: { flex: 1, borderColor: 'rgba(255,255,255,0.2)' },
  modalCancelText: { color: '#fff', fontWeight: '700' },
  modalPrimaryBtn: { flex: 1, backgroundColor: '#22D3EE', justifyContent: 'center', borderRadius: 100 },
  modalSubmitText: { color: '#0A2A33', fontWeight: '800' },
});
