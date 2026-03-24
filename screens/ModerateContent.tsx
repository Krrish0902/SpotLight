import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Play, X } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { supabase } from '../lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

function ReportVideoPlayer({ uri, onClose }: { uri: string; onClose: () => void }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.play();
  });
  return (
    <View style={styles.modalPlayerWrap}>
      <Pressable onPress={onClose} style={styles.modalCloseHit} hitSlop={12}>
        <X size={22} color="#fff" />
      </Pressable>
      <VideoView
        player={player}
        style={styles.modalVideo}
        contentFit="contain"
        nativeControls
      />
    </View>
  );
}

interface Props { navigate: (screen: string) => void; }

interface ReportRow {
  report_id: string;
  report_type: 'video' | 'profile';
  target_id: string;
  reported_by: string;
  reason: string;
  status: string;
  created_at: string;
}

interface VideoRow {
  video_id: string;
  title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  artist_id: string | null;
}

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  username: string | null;
}

export default function ModerateContent({ navigate }: Props) {
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [videosMap, setVideosMap] = useState<Record<string, VideoRow>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, ProfileRow>>({});
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [previewUri, setPreviewUri] = useState<string | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data: reportRows, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('report_type', 'video')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (reportsError) throw reportsError;

      const queue = (reportRows as ReportRow[]) || [];
      setReports(queue);

      const videoIds = Array.from(new Set(queue.map((r) => r.target_id).filter(Boolean)));
      const reporterIds = Array.from(new Set(queue.map((r) => r.reported_by).filter(Boolean)));
      if (videoIds.length === 0) {
        setVideosMap({});
        setProfilesMap({});
        return;
      }

      const [videosRes, reportersRes] = await Promise.all([
        supabase.from('videos').select('video_id, title, thumbnail_url, video_url, artist_id').in('video_id', videoIds),
        supabase.from('profiles').select('user_id, display_name, username').in('user_id', reporterIds),
      ]);
      if (videosRes.error) throw videosRes.error;
      if (reportersRes.error) throw reportersRes.error;

      const vMap: Record<string, VideoRow> = {};
      (videosRes.data || []).forEach((v: any) => { vMap[v.video_id] = v; });
      setVideosMap(vMap);

      const pMap: Record<string, ProfileRow> = {};
      (reportersRes.data || []).forEach((p: any) => { pMap[p.user_id] = p; });
      setProfilesMap(pMap);
    } catch (e) {
      console.error('Failed to fetch video report queue:', e);
      setReports([]);
      setVideosMap({});
      setProfilesMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const reportCountByVideo = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => {
      map[r.target_id] = (map[r.target_id] || 0) + 1;
    });
    return map;
  }, [reports]);

  const topReports = useMemo(() => {
    const groupedIds = Array.from(new Set(reports.map((r) => r.target_id)));
    return groupedIds
      .map((id) => ({
        videoId: id,
        count: reportCountByVideo[id] || 0,
        latestReport: reports.find((r) => r.target_id === id),
      }))
      .sort((a, b) => b.count - a.count);
  }, [reports, reportCountByVideo]);

  const openReportVideo = (videoId: string) => {
    const url = videosMap[videoId]?.video_url;
    if (!url) {
      Alert.alert('Video unavailable', 'No video URL for this report.');
      return;
    }
    setPreviewUri(url);
  };

  const relativeTime = (iso: string) => {
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const m = Math.floor((Date.now() - t) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const resolveReports = async (videoId: string, action: 'remove_video' | 'dismiss') => {
    setActionLoadingId(videoId);
    try {
      if (action === 'remove_video') {
        const { error: deleteError } = await supabase.from('videos').delete().eq('video_id', videoId);
        if (deleteError) throw deleteError;
      }
      const payload = {
        status: 'resolved',
        resolution_action: action,
        resolved_at: new Date().toISOString(),
        admin_note: adminNotes[videoId] || null,
      };
      const { error: resolveError } = await supabase
        .from('reports')
        .update(payload)
        .eq('report_type', 'video')
        .eq('target_id', videoId)
        .eq('status', 'pending');
      if (resolveError) throw resolveError;
      setReports((prev) => prev.filter((r) => r.target_id !== videoId));
    } catch (e: any) {
      console.error('Failed to resolve video reports:', e);
      Alert.alert('Error', e?.message || 'Could not process this report.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('admin-dashboard')}>
          <ChevronLeft size={22} color="#fff" />
        </Button>
        <View style={styles.headerText}>
          <Text style={styles.title}>Content reports</Text>
          <Text style={styles.headerMeta}>
            {loading ? '…' : `${reports.length} pending`}
          </Text>
        </View>
      </View>

      <Modal
        visible={previewUri != null}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.modalRoot}>
          {previewUri ? (
            <ReportVideoPlayer uri={previewUri} onClose={() => setPreviewUri(null)} />
          ) : null}
        </View>
      </Modal>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.stateWrap}>
            <ActivityIndicator color="#22D3EE" size="large" />
            <Text style={styles.stateText}>Loading…</Text>
          </View>
        ) : topReports.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No video reports</Text>
            <Text style={styles.emptyText}>Queue is clear.</Text>
          </Card>
        ) : (
          topReports.map((item) => {
            const v = videosMap[item.videoId];
            const report = item.latestReport;
            if (!report) return null;
            const reporter = profilesMap[report.reported_by];
            const reporterLabel = reporter?.display_name || (reporter?.username ? `@${reporter.username}` : 'User');
            const reasonLine = (report.reason || 'No reason').split(':')[0].slice(0, 48);
            return (
              <View key={item.videoId} style={styles.reportRow}>
                <Pressable
                  onPress={() => openReportVideo(item.videoId)}
                  style={({ pressed }) => [styles.thumbWrap, pressed && styles.thumbPressed]}
                >
                  <Image
                    source={{ uri: v?.thumbnail_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=200&h=200&fit=crop' }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                  <View style={styles.thumbPlay}>
                    <Play size={14} color="#fff" />
                  </View>
                </Pressable>
                <View style={styles.rowMain}>
                  <Pressable
                    onPress={() => openReportVideo(item.videoId)}
                    style={({ pressed }) => [styles.rowTapHead, pressed && styles.rowTapHeadPressed]}
                  >
                    <Text style={styles.rowTitle} numberOfLines={1}>
                      {v?.title || 'Untitled'}
                    </Text>
                    <Text style={styles.rowSub} numberOfLines={2}>
                      {reasonLine}
                      {item.count > 1 ? ` · ${item.count} reports` : ''} · {reporterLabel} · {relativeTime(report.created_at)}
                    </Text>
                  </Pressable>
                  <TextInput
                    placeholder="Note (optional)"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    style={styles.rowNote}
                    value={adminNotes[item.videoId] || ''}
                    onChangeText={(val) => setAdminNotes((prev) => ({ ...prev, [item.videoId]: val }))}
                  />
                  <View style={styles.rowActions}>
                    <Button
                      variant="outline"
                      size="sm"
                      style={styles.rowBtn}
                      disabled={actionLoadingId === item.videoId}
                      onPress={() => resolveReports(item.videoId, 'dismiss')}
                    >
                      <Text style={styles.dismissLabel}>Dismiss</Text>
                    </Button>
                    <Button
                      size="sm"
                      style={styles.removeBtn}
                      disabled={actionLoadingId === item.videoId}
                      onPress={() =>
                        Alert.alert(
                          'Remove video?',
                          'Permanently deletes this video.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Remove', style: 'destructive', onPress: () => resolveReports(item.videoId, 'remove_video') },
                          ]
                        )
                      }
                    >
                      <Text style={styles.removeLabel}>Remove</Text>
                    </Button>
                  </View>
                </View>
                {item.count > 1 ? <Badge style={styles.countPill}>{item.count}</Badge> : null}
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingTop: 60, paddingBottom: 8 },
  headerText: { flex: 1 },
  title: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerMeta: { fontSize: 13, color: 'rgba(255,255,255,0.48)', marginTop: 2 },
  scroll: { paddingHorizontal: 14, paddingBottom: 100, gap: 8 },
  stateWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, gap: 8 },
  stateText: { color: 'rgba(255,255,255,0.55)', fontSize: 14 },
  emptyCard: { padding: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: StyleSheet.hairlineWidth },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptyText: { color: 'rgba(255,255,255,0.5)', marginTop: 4, fontSize: 13 },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  thumbPressed: { opacity: 0.85 },
  thumbWrap: { width: 56, height: 56, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumb: { width: '100%', height: '100%' },
  thumbPlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  rowMain: { flex: 1, minWidth: 0 },
  rowTapHead: { paddingVertical: 2 },
  rowTapHeadPressed: { opacity: 0.8 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: '#fff' },
  rowSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 },
  rowNote: {
    marginTop: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    fontSize: 12,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  rowBtn: { flex: 1, minHeight: 36, borderColor: 'rgba(255,255,255,0.2)' },
  removeBtn: { flex: 1, minHeight: 36, backgroundColor: 'rgba(248,113,113,0.9)' },
  dismissLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  removeLabel: { color: '#1a1025', fontSize: 13, fontWeight: '700' },
  countPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(34,211,238,0.25)',
    borderWidth: 0,
  },
  modalRoot: { flex: 1, backgroundColor: '#000' },
  modalPlayerWrap: { flex: 1, paddingTop: 52, paddingBottom: 24 },
  modalCloseHit: {
    position: 'absolute',
    top: 14,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVideo: { flex: 1, width: SCREEN_W },
});
