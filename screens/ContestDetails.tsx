import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Pressable,
  Modal,
  Platform,
  Image as RNImage,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Trophy, Play } from 'lucide-react-native';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoFeedItem, VideoFeedItemData } from '../components/VideoFeedItem';

interface Props {
  navigate: (screen: string, data?: any) => void;
  contestId?: string;
}

type ContestDetails = {
  contest_id: string;
  title: string;
  description?: string | null;
  rules?: string | null;
  prize?: string | null;
  poster_url?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  is_active?: boolean | null;
};

type SubmissionRow = {
  submission_id: string;
  contest_id: string;
  artist_id: string;
  video_id: string;
  submitted_at: string;
  is_winner: boolean;
  is_your_entry: boolean;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  video_title: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
};

const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=1200&fit=crop';
const DEFAULT_THUMB =
  'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop';

function toDateLabel(iso?: string | null) {
  if (!iso) return '—';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return '—';
  return t.toLocaleDateString();
}

export default function ContestDetails({ navigate, contestId }: Props) {
  const { appUser } = useAuth();
  const artistId = appUser?.id;
  const role = appUser?.role;
  const insets = useSafeAreaInsets();
  const SCREEN_HEIGHT = Dimensions.get('window').height;
  const SCREEN_WIDTH = Dimensions.get('window').width;

  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [posterFailed, setPosterFailed] = useState(false);
  const [enterModalOpen, setEnterModalOpen] = useState(false);
  const [videoFile, setVideoFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [previewUri, setPreviewUri] = useState<string>('');
  const [thumbnailUri, setThumbnailUri] = useState<string>('');
  const [entryTitle, setEntryTitle] = useState<string>('');
  const [entryCaption, setEntryCaption] = useState<string>('');
  const [pickingVideo, setPickingVideo] = useState(false);
  const [generatingThumb, setGeneratingThumb] = useState(false);
  const [enterSubmitting, setEnterSubmitting] = useState(false);

  // Finalize contest winners once after the contest ends (server-side),
  // so Discover winners update even if user lands here first.
  const [winnerFinalizeAttempted, setWinnerFinalizeAttempted] = useState(false);

  const [videoFeedVisible, setVideoFeedVisible] = useState(false);
  const [videoFeedInitialIndex, setVideoFeedInitialIndex] = useState(0);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(false);

  const yourEntry = useMemo(
    () => submissions.find((s) => s.is_your_entry),
    [submissions]
  );

  const contestIsOpen = useMemo(() => {
    if (!contest) return false;
    const isActive = contest.is_active ?? true;
    if (!isActive) return false;
    if (!contest.start_date || !contest.end_date) return true;
    const now = new Date();
    const start = new Date(contest.start_date);
    const end = new Date(contest.end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return true;
    return now >= start && now <= end;
  }, [contest]);

  const canEnter = role === 'artist' && !!artistId && contestIsOpen;

  const load = async () => {
    if (!contestId) return;
    setLoading(true);
    try {
      const { data: contestData, error: contestErr } = await supabase.rpc(
        'get_contest_details_for_public',
        { p_contest_id: contestId }
      );
      if (contestErr) throw contestErr;

      // For RPC returning TABLE, supabase-js returns an array.
      const contestRow = Array.isArray(contestData) ? contestData[0] : contestData;
      setContest(contestRow as any);
      setPosterFailed(false);

      const { data: submissionData, error: subsErr } = await supabase.rpc(
        'get_contest_submissions_for_public',
        {
          p_contest_id: contestId,
          p_artist_id: artistId ?? null,
        }
      );
      if (subsErr) throw subsErr;

      setSubmissions((submissionData || []) as any);
    } catch (e: any) {
      console.error('Failed to load contest:', e);
      Alert.alert('Error', 'Could not load contest details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId, artistId]);

  useEffect(() => {
    if (!contest) return;
    if (winnerFinalizeAttempted) return;

    const end = contest.end_date ? new Date(contest.end_date) : null;
    if (!end || Number.isNaN(end.getTime())) return;

    // If contest has ended, trigger winner finalization RPC (idempotent via winner_finalized_at).
    if (Date.now() > end.getTime()) {
      setWinnerFinalizeAttempted(true);
      (async () => {
        try {
          const { error } = await supabase.rpc('get_contest_winners_for_discover', {});
          if (error) throw error;
        } catch (e: any) {
          console.error('Winner finalize RPC failed:', e);
        }
      })();
    }
  }, [contest, winnerFinalizeAttempted]);

  const onViewableVideosChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const openVideoFeed = (index: number) => {
    setVideoFeedInitialIndex(index);
    setActiveVideoIndex(index);
    setVideoFeedVisible(true);
  };

  const openEnterModal = async () => {
    if (!artistId || role !== 'artist') {
      Alert.alert('Login required', 'Only artists can enter contests.');
      return;
    }

    setEnterModalOpen(true);
    setVideoFile(null);
    setPreviewUri('');
    setThumbnailUri('');
    setEntryTitle('');
    setEntryCaption('');
    setPickingVideo(false);
    setGeneratingThumb(false);
  };

  const generateThumbFromVideo = async (videoUri: string) => {
    setGeneratingThumb(true);
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, { time: 1000 });
      setThumbnailUri(uri);
    } catch (e) {
      console.warn('Could not generate contest thumbnail', e);
      setThumbnailUri('');
    } finally {
      setGeneratingThumb(false);
    }
  };

  const pickContestVideo = async () => {
    if (enterSubmitting) return;
    try {
      setPickingVideo(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (result.canceled) return;
      const asset = result.assets[0];
      setVideoFile(asset);
      setPreviewUri(asset.uri);
      await generateThumbFromVideo(asset.uri);
    } catch (e: any) {
      console.error('Failed to pick contest video:', e);
      Alert.alert('Error', e?.message || 'Could not pick a video.');
    } finally {
      setPickingVideo(false);
    }
  };

  const uploadFile = async (uri: string, folder: 'videos' | 'thumbnails', contentType?: string) => {
    if (!appUser?.id) throw new Error('Missing user id');

    const fileExt = uri.split('.').pop() || 'mp4';
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
    const filePath = `${appUser.id}/${fileName}`;

    let fileData: ArrayBuffer | Blob;
    if (Platform.OS === 'web') {
      const response = await fetch(uri);
      fileData = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      fileData = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
    }

    const { error: uploadError } = await supabase.storage
      .from(folder)
      .upload(filePath, fileData as any, {
        contentType: contentType || (folder === 'videos' ? (videoFile?.mimeType ?? 'video/mp4') : 'image/jpeg'),
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicData } = supabase.storage.from(folder).getPublicUrl(filePath);
    return (publicData as any)?.publicUrl as string | undefined;
  };

  const uploadAndEnter = async () => {
    if (!contestId || !artistId || !videoFile) return;
    if (!entryTitle.trim()) {
      Alert.alert('Title required', 'Please enter a title for your contest entry.');
      return;
    }

    setEnterSubmitting(true);
    try {
      // Upload video + thumbnail, then insert the video row with contest-only visibility.
      const videoPublicUrl = await uploadFile(videoFile.uri, 'videos', videoFile.mimeType ?? 'video/mp4');
      const thumbnailPublicUrl = thumbnailUri ? await uploadFile(thumbnailUri, 'thumbnails', 'image/jpeg') : null;

      if (!videoPublicUrl) throw new Error('Video upload failed.');

      const { data: inserted, error: insertErr } = await supabase
        .from('videos')
        .insert({
          artist_id: artistId,
          video_url: videoPublicUrl,
          thumbnail_url: thumbnailPublicUrl,
          title: entryTitle.trim(),
          description: entryCaption.trim() ? entryCaption.trim() : null,
          genres: [],
          instruments: [],
          tags: [],
          upload_date: new Date().toISOString(),
          is_contest_entry: true,
        })
        .select('video_id')
        .single();

      if (insertErr) throw insertErr;

      const videoId = (inserted as any)?.video_id as string | undefined;
      if (!videoId) throw new Error('Could not create contest video.');

      const res = await supabase.rpc('artist_enter_contest', {
        p_contest_id: contestId,
        p_video_id: videoId,
      });
      if (res.error) throw res.error;

      setEnterModalOpen(false);
      setVideoFile(null);
      setPreviewUri('');
      setThumbnailUri('');
      setEntryTitle('');
      setEntryCaption('');

      await load();
      Alert.alert('Entry saved', yourEntry ? 'Your entry was replaced.' : 'You entered the contest!');
    } catch (e: any) {
      console.error('Enter contest failed:', e);
      Alert.alert('Error', e?.message || 'Could not submit your entry.');
    } finally {
      setEnterSubmitting(false);
    }
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Button variant="ghost" size="icon" onPress={() => navigate('search-discover')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
      </View>

      {loading || !contest ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#22D3EE" />
          <Text style={styles.loadingText}>Loading contest…</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 50 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            {!posterFailed ? (
              <RNImage
                source={{ uri: contest.poster_url || DEFAULT_POSTER }}
                style={styles.heroPoster}
                resizeMode="cover"
                onError={() => setPosterFailed(true)}
              />
            ) : (
              <View style={styles.posterFallback}>
                <Text style={styles.posterFallbackText}>Contest Poster</Text>
              </View>
            )}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)', '#000']}
              style={styles.heroGradient}
            />
          </View>

          <View style={styles.heroBody}>
            <Text style={styles.title}>{contest.title}</Text>
            <View style={styles.metaRow}>
              {contest.prize ? (
                <Badge style={styles.prizeBadge} icon={<Trophy size={12} color="#000" />}>
                  {contest.prize}
                </Badge>
              ) : null}
              <Text style={styles.metaText}>
                {toDateLabel(contest.start_date)} → {toDateLabel(contest.end_date)}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            {contest.description ? (
              <>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{contest.description}</Text>
              </>
            ) : null}
            {contest.rules ? (
              <>
                <Text style={styles.sectionTitle}>(Entry) Rules</Text>
                <Text style={styles.sectionText}>{contest.rules}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.actionsCard}>
            <Button
              style={styles.enterBtn}
              disabled={!canEnter}
              onPress={openEnterModal}
            >
              <Text style={styles.enterBtnText}>
                {yourEntry ? 'Replace Entry' : 'Enter Contest'}
              </Text>
            </Button>
            {!canEnter ? (
              <Text style={styles.helperText}>
                {role !== 'artist' ? 'Artists only.' : 'Contest is not active.'}
              </Text>
            ) : null}
          </View>

          <Text style={styles.sectionHeader}>Currently entered videos</Text>
          {submissions.length === 0 ? (
            <Text style={styles.sectionTextMuted}>No submissions yet.</Text>
          ) : (
            <View style={styles.videoGrid}>
              {submissions.map((s, idx) => (
                <Pressable
                  key={s.submission_id}
                  style={styles.videoItem}
                  onPress={() => openVideoFeed(idx)}
                >
                  <RNImage
                    source={{ uri: s.thumbnail_url || DEFAULT_THUMB }}
                    style={styles.videoThumb}
                    resizeMode="cover"
                  />
                  {s.is_your_entry ? (
                    <View style={styles.yourPill}>
                      <Text style={styles.yourPillText}>You</Text>
                    </View>
                  ) : null}
                  <View style={styles.videoInfo}>
                    <Text style={styles.videoTitle} numberOfLines={1}>
                      {s.video_title || 'Untitled'}
                    </Text>
                    <Text style={styles.videoViews}>
                      {0} views
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      )}

      <Modal
        visible={videoFeedVisible}
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setVideoFeedVisible(false)}
      >
        <View style={styles.videoFeedModal}>
          <View style={styles.videoFeedHeader}>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => setVideoFeedVisible(false)}
              style={styles.videoFeedBackBtn}
            >
              <ChevronLeft size={24} color="#fff" />
            </Button>
          </View>
          <FlatList
            data={submissions}
            keyExtractor={(item) => item.video_id}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToAlignment="start"
            decelerationRate="fast"
            onViewableItemsChanged={onViewableVideosChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
            initialScrollIndex={videoFeedInitialIndex}
            getItemLayout={(_d, index) => ({
              length: SCREEN_HEIGHT,
              offset: SCREEN_HEIGHT * index,
              index,
            })}
            renderItem={({ item, index }) => {
              const feedItem: VideoFeedItemData = {
                video_id: item.video_id,
                video_url: item.video_url ?? '',
                thumbnail_url: item.thumbnail_url ?? undefined,
                title: item.video_title ?? undefined,
                artist_id: item.artist_id,
                likes_count: undefined,
                views_count: undefined,
                profiles: item.artist_id
                  ? {
                      user_id: item.artist_id,
                      display_name: item.display_name ?? undefined,
                      username: item.username ?? undefined,
                      avatar_url: item.avatar_url ?? undefined,
                    }
                  : undefined,
              };

              return (
                <VideoFeedItem
                  item={feedItem}
                  isActive={index === activeVideoIndex}
                  muted={videoMuted}
                  onToggleMute={() => setVideoMuted((m) => !m)}
                  showProfileOverlay={false}
                  showFeedActions
                  showMessageAction={false}
                  feedActionsBottomOffset={insets.bottom + 96}
                  containerHeight={SCREEN_HEIGHT}
                  containerWidth={SCREEN_WIDTH}
                />
              );
            }}
          />
        </View>
      </Modal>

      <Modal
        visible={enterModalOpen}
        animationType="slide"
        onRequestClose={() => setEnterModalOpen(false)}
        transparent={false}
      >
        <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.modalContainer}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <Button variant="ghost" size="icon" onPress={() => setEnterModalOpen(false)} disabled={enterSubmitting}>
              <ChevronLeft size={24} color="#fff" />
            </Button>
            <View style={styles.modalHeaderText}>
              <Text style={styles.modalTitle}>
                {yourEntry ? 'Replace your entry' : 'Upload a contest video'}
              </Text>
              <Text style={styles.modalSub}>One entry per contest. Your video stays in the contest only.</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.uploadSection}>
              <Pressable
                style={styles.uploadPicker}
                onPress={pickContestVideo}
                disabled={enterSubmitting || pickingVideo}
              >
                {previewUri ? (
                  <>
                    <RNImage
                      source={{ uri: thumbnailUri || previewUri }}
                      style={styles.uploadPreviewThumb}
                      resizeMode="cover"
                    />
                    <View style={styles.uploadPlayOverlay}>
                      <Play size={22} color="#fff" />
                    </View>
                    {(generatingThumb || pickingVideo) && (
                      <View style={styles.uploadSpinnerOverlay}>
                        <ActivityIndicator size="large" color="#22D3EE" />
                      </View>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      style={styles.uploadChangeBtn}
                      onPress={() => {
                        setVideoFile(null);
                        setPreviewUri('');
                        setThumbnailUri('');
                        setEntryTitle('');
                        setEntryCaption('');
                      }}
                      disabled={enterSubmitting}
                    >
                      <Text style={styles.uploadChangeBtnText}>Change</Text>
                    </Button>
                  </>
                ) : (
                  <View style={styles.uploadPlaceholderInner}>
                    <Text style={styles.uploadPlaceholderTitle}>Upload contest video</Text>
                    <Text style={styles.uploadPlaceholderSub}>Hidden from your profile</Text>
                  </View>
                )}
              </Pressable>

              <Text style={styles.sectionLabel}>Title</Text>
              <Input
                placeholder="Give your entry a title"
                value={entryTitle}
                onChangeText={setEntryTitle}
                editable={!enterSubmitting}
              />

              <Text style={styles.sectionLabel}>(Optional) Caption</Text>
              <Textarea
                placeholder="Describe your performance…"
                value={entryCaption}
                onChangeText={setEntryCaption}
                editable={!enterSubmitting}
                style={styles.captionInput}
              />

              <View style={styles.modalFooter}>
                <Button
                  style={styles.modalConfirmBtn}
                  disabled={!videoFile || !entryTitle.trim() || enterSubmitting}
                  onPress={uploadAndEnter}
                >
                  <Text style={styles.modalConfirmText}>
                    {enterSubmitting ? 'Uploading…' : yourEntry ? 'Replace Entry' : 'Enter Contest'}
                  </Text>
                </Button>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 120 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontWeight: '600' },

  hero: { width: '100%', height: 260, overflow: 'hidden', borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroPoster: { width: '100%', height: '100%' },
  heroGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, top: 0 },

  heroBody: { marginTop: 14, marginBottom: 10 },
  title: { color: '#fff', fontSize: 26, fontWeight: '900' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' },
  prizeBadge: { backgroundColor: '#eab308' },
  metaText: { color: 'rgba(255,255,255,0.65)', fontWeight: '700' },

  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 22, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', marginTop: 10 },
  sectionTitle: { color: '#fff', fontWeight: '900', fontSize: 14, marginBottom: 8, marginTop: 4 },
  sectionText: { color: 'rgba(255,255,255,0.78)', fontWeight: '600', lineHeight: 22 },

  actionsCard: { marginTop: 14, padding: 16, borderRadius: 22, backgroundColor: 'rgba(34,211,238,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(34,211,238,0.25)' },
  enterBtn: { backgroundColor: '#22D3EE', borderRadius: 100, width: '100%' },
  enterBtnText: { color: '#0A2A33', fontWeight: '900' },
  helperText: { color: 'rgba(255,255,255,0.62)', marginTop: 10, fontWeight: '700' },

  sectionHeader: { marginTop: 20, color: '#fff', fontWeight: '900', fontSize: 16, marginBottom: 10 },

  entryCard: { padding: 12, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  entryThumbWrap: { width: 92, height: 130, borderRadius: 18, overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(255,255,255,0.03)' },
  entryThumb: { width: '100%', height: '100%' },
  entryPlayOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  entryBody: { marginTop: 10 },
  entryTitle: { color: '#fff', fontWeight: '900' },
  entrySub: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', marginTop: 4 },
  emptyEntryTitle: { color: '#fff', fontWeight: '900', fontSize: 16 },
  emptyEntryText: { color: 'rgba(255,255,255,0.62)', fontWeight: '700', marginTop: 6, lineHeight: 20 },

  sectionTextMuted: { color: 'rgba(255,255,255,0.62)', fontWeight: '700', lineHeight: 22 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: { width: '47%' },
  gridThumbWrap: { position: 'relative', borderRadius: 18, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', height: 180 },
  gridThumb: { width: '100%', height: '100%' },
  gridTitle: { color: '#fff', fontWeight: '800', marginTop: 8 },

  yourPill: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(34,211,238,0.92)' },
  yourPillText: { color: '#fff', fontWeight: '900', fontSize: 12 },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingTop: 56, paddingHorizontal: 14 },
  modalHeaderText: { flex: 1 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  modalSub: { color: 'rgba(255,255,255,0.6)', marginTop: 4, fontWeight: '700', fontSize: 12 },
  modalScroll: { padding: 14, paddingBottom: 120 },
  modalLoadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  modalEmptyCard: { padding: 16, borderRadius: 22 },

  emptyTitleText: { color: '#fff', fontWeight: '900', fontSize: 16 },

  modalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  modalGridItem: { width: '47%', borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)' },
  modalGridItemActive: { borderColor: 'rgba(34,211,238,0.55)' },
  selectedOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(34,211,238,0.35)' },
  selectedText: { color: '#fff', fontWeight: '900' },
  modalGridTitle: { color: '#fff', fontWeight: '800', padding: 10 },

  modalFooter: { position: 'absolute', left: 14, right: 14, bottom: 26 },
  modalConfirmBtn: { backgroundColor: '#22D3EE', justifyContent: 'center', borderRadius: 100, width: '100%' },
  modalConfirmText: { color: '#0A2A33', fontWeight: '900' },

  sectionLabel: { color: '#fff', fontWeight: '800', fontSize: 14, marginTop: 14, marginBottom: 8 },

  uploadSection: { marginTop: 6 },
  uploadPicker: {
    height: 320,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  uploadPlaceholderInner: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadPlaceholderTitle: { color: '#fff', fontWeight: '900', textAlign: 'center' },
  uploadPlaceholderSub: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', textAlign: 'center', fontSize: 12 },

  uploadPreviewThumb: { width: '100%', height: '100%', position: 'absolute' },
  uploadPlayOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  uploadSpinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  uploadChangeBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    minHeight: 36,
  },
  uploadChangeBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, paddingHorizontal: 10 },
  captionInput: { minHeight: 120 },

  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  videoItem: {
    width: '47%',
    aspectRatio: 9 / 16,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  videoThumb: { width: '100%', height: '100%', opacity: 0.9 },
  videoInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  videoTitle: { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  videoViews: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  videoFeedModal: { flex: 1, backgroundColor: '#050A18' },
  videoFeedHeader: { position: 'absolute', top: 56, left: 16, zIndex: 10 },
  videoFeedBackBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8 },

  posterFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterFallbackText: { color: 'rgba(255,255,255,0.75)', fontWeight: '800' },
});

