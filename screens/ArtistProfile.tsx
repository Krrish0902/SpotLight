import React, { useState, useEffect, useRef } from 'react';
import Animated, { FadeIn, FadeInDown, SlideInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { View, ScrollView, StyleSheet, ActivityIndicator, FlatList, Dimensions, Modal, Pressable, Alert, KeyboardAvoidingView, Platform } from 'react-native';

import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Text } from '../components/ui/Text';

import { ChevronLeft, Share2, MapPin, Music, Calendar, MessageSquare, Star, Pencil, LayoutDashboard, LogOut, Camera, Video, Flag } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Textarea } from '../components/ui/Textarea';
import BottomNav from '../components/layout/BottomNav';
import { VideoFeedItem, VideoFeedItemData } from '../components/VideoFeedItem';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { isUserEffectivelySuspended } from '../lib/suspension';
import { track } from '../lib/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Video extends VideoFeedItemData {
  video_id: string;
  thumbnail_url?: string;
  title?: string;
  views_count: number;
}

interface ScheduleEvent {
  id: string;
  eventId?: string;
  date: string;
  time: string | null;
  title: string;
  venue: string | null;
  source: 'schedule' | 'booking' | 'organizer_event' | 'unavailable';
  status?: string;
}

interface Props {
  navigate: (screen: string, data?: any) => void;
  artist?: any;
  userRole?: string;
  returnTo?: string;
}

export default function ArtistProfile({ navigate, artist, userRole = 'public', returnTo }: Props) {
  const insets = useSafeAreaInsets();
  const { profile, appUser, fetchProfile, signOut } = useAuth();
  const artistUserId = artist?.user_id || artist?.id;
  const isOwnProfile =
    artist?.id === 'me' ||
    (appUser && artistUserId === appUser.id);

  // Determine the ID to fetch videos for
  const targetArtistId = isOwnProfile ? appUser?.id : artistUserId;

  const [videos, setVideos] = useState<Video[]>([]);
  const [viewedProfile, setViewedProfile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [fetchedAt, setFetchedAt] = useState(Date.now());
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<ScheduleEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [videoMuted, setVideoMuted] = useState(false);
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoFeedVisible, setVideoFeedVisible] = useState(false);
  const [videoFeedInitialIndex, setVideoFeedInitialIndex] = useState(0);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [userReview, setUserReview] = useState<any | null>(null);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [connectRequestStatus, setConnectRequestStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('impersonation');
  const [reportNote, setReportNote] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableStartDate, setUnavailableStartDate] = useState<Date>(new Date());
  const [unavailableEndDate, setUnavailableEndDate] = useState<Date>(new Date());
  const [unavailableReason, setUnavailableReason] = useState('');
  const [showUnavailableStartPicker, setShowUnavailableStartPicker] = useState(false);
  const [showUnavailableEndPicker, setShowUnavailableEndPicker] = useState(false);
  const [savingUnavailable, setSavingUnavailable] = useState(false);
  const [isUnavailableToday, setIsUnavailableToday] = useState(false);
  const [hasUnavailableWindow, setHasUnavailableWindow] = useState(false);
  const [unavailableTodayReason, setUnavailableTodayReason] = useState<string | null>(null);
  const [unavailableRangeStart, setUnavailableRangeStart] = useState<string | null>(null);
  const [unavailableRangeEnd, setUnavailableRangeEnd] = useState<string | null>(null);
  const videoListRef = useRef<FlatList>(null);
  const onViewableVideosChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveVideoIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const openVideoFeed = (index: number) => {
    setVideoFeedInitialIndex(index);
    setActiveVideoIndex(index);
    setVideoFeedVisible(true);
  };

  // Refetch profile when viewing own profile to ensure we have latest data (fixes stale/empty data on tab switch)
  useEffect(() => {
    if (isOwnProfile && appUser?.id && fetchProfile) {
      fetchProfile();
    }
  }, [isOwnProfile, appUser?.id]);

  useEffect(() => {
    if (targetArtistId) {
      fetchVideos();
      fetchUpcomingEvents();
      if (!isOwnProfile) {
        fetchViewedProfile();
        // Step 3: Silent Tracking - Profile View
        (async () => {
          try {
            track.profileView(targetArtistId, appUser?.id || undefined);
      } catch (err) {
            console.log('Silent tracking failed', err);
          }
        })();
      }
      fetchReviews();
    }
  }, [targetArtistId, isOwnProfile]);

  useEffect(() => {
    const fetchConnectStatus = async () => {
      if (!appUser?.id || !targetArtistId || isOwnProfile) return;
      try {
        const { data } = await supabase
          .from('message_requests')
          .select('status')
          .or(`and(sender_id.eq.${appUser.id},receiver_id.eq.${targetArtistId}),and(sender_id.eq.${targetArtistId},receiver_id.eq.${appUser.id})`)
          .maybeSingle();
        setConnectRequestStatus((data?.status as any) || 'none');
      } catch {
        setConnectRequestStatus('none');
      }
    };
    fetchConnectStatus();
  }, [appUser?.id, targetArtistId, isOwnProfile]);

  const fetchViewedProfile = async () => {
    if (!targetArtistId) return;
    try {
      const [{ data, error }, blocked] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('user_id', targetArtistId)
          .single(),
        isUserEffectivelySuspended(targetArtistId),
      ]);
      if (!error && data) {
        if (blocked && userRole !== 'admin') {
          Alert.alert('Profile unavailable', 'This account is currently suspended.');
          navigate(returnTo ?? 'public-home');
          return;
        }
        setViewedProfile(data);
        setFetchedAt(Date.now());
      }
    } catch (e) {
      console.error('Error fetching viewed profile:', e);
    }
  };

  const fetchUpcomingEvents = async () => {
    if (!targetArtistId) return;
    setLoadingEvents(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const events: ScheduleEvent[] = [];

      const { data: scheduleData } = await supabase
        .from('artist_schedule')
        .select('schedule_id, schedule_date, start_time, title, venue')
        .eq('artist_id', targetArtistId)
        .gte('schedule_date', today)
        .order('schedule_date', { ascending: true })
        .limit(5);

      (scheduleData || []).forEach((s: any) => {
        const time = s.start_time ? String(s.start_time).slice(0, 5) : null;
        events.push({
          id: s.schedule_id,
          date: s.schedule_date,
          time,
          title: s.title,
          venue: s.venue,
          source: 'schedule',
        });
      });

      if (isOwnProfile) {
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('booking_id, event_date, status')
          .eq('artist_id', targetArtistId)
          .in('status', ['accepted', 'pending'])
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);

        (bookingsData || []).forEach((b: any) => {
          const d = new Date(b.event_date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          events.push({
            id: b.booking_id,
            date: dateStr,
            time: timeStr,
            title: 'Booking',
            venue: null,
            source: 'booking',
            status: b.status,
          });
        });

        const { data: organizerEventsData } = await supabase
          .from('events')
          .select('event_id, title, event_date, location_name, city')
          .eq('organizer_id', targetArtistId)
          .eq('approval_status', 'approved')
          .eq('is_deleted', false)
          .gte('event_date', today)
          .order('event_date', { ascending: true })
          .limit(5);

        (organizerEventsData || []).forEach((ev: any) => {
          const d = new Date(ev.event_date);
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
          events.push({
            id: ev.event_id,
            eventId: ev.event_id,
            date: dateStr,
            time: timeStr,
            title: ev.title || 'Event',
            venue: [ev.location_name, ev.city].filter(Boolean).join(', ') || null,
            source: 'organizer_event',
            status: 'approved',
          });
        });
      }

      const { data: availabilityWindow, error: availabilityErr } = await supabase.rpc(
        'get_public_availability_window',
        {
          p_artist_id: targetArtistId,
          p_today: today,
        }
      );
      if (availabilityErr) throw availabilityErr;

      const availabilityRow = Array.isArray(availabilityWindow)
        ? availabilityWindow[0]
        : availabilityWindow;

      const hasWindow = !!(availabilityRow as any)?.has_unavailable_window;
      const isTodayBlocked = !!(availabilityRow as any)?.is_unavailable_today;
      const winStart = (availabilityRow as any)?.window_start
        ? String((availabilityRow as any).window_start)
        : null;
      const winEnd = (availabilityRow as any)?.window_end
        ? String((availabilityRow as any).window_end)
        : null;
      const winReason = ((availabilityRow as any)?.window_reason as string | null) || null;

      setHasUnavailableWindow(hasWindow);
      setIsUnavailableToday(isTodayBlocked);
      setUnavailableRangeStart(winStart);
      setUnavailableRangeEnd(winEnd);
      setUnavailableTodayReason(winReason);

      events.sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        if (cmp !== 0) return cmp;
        return (a.time || '00:00').localeCompare(b.time || '00:00');
      });
      setUpcomingEvents(events.slice(0, 3));
    } catch (e) {
      console.error('Error fetching events:', e);
      setUpcomingEvents([]);
      setIsUnavailableToday(false);
      setHasUnavailableWindow(false);
      setUnavailableTodayReason(null);
      setUnavailableRangeStart(null);
      setUnavailableRangeEnd(null);
    } finally {
      setLoadingEvents(false);
    }
  };

  const formatDateOnly = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatDateLabel = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(`${dateStr}T00:00:00`);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const buildDateRange = (start: Date, end: Date) => {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const out: string[] = [];
    const cursor = new Date(startDate);
    while (cursor.getTime() <= endDate.getTime()) {
      out.push(formatDateOnly(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return out;
  };

  const saveUnavailableRange = async () => {
    if (!appUser?.id || !targetArtistId || !isOwnProfile) return;
    const start = new Date(unavailableStartDate.getFullYear(), unavailableStartDate.getMonth(), unavailableStartDate.getDate());
    const end = new Date(unavailableEndDate.getFullYear(), unavailableEndDate.getMonth(), unavailableEndDate.getDate());
    if (end.getTime() < start.getTime()) {
      Alert.alert('Invalid range', 'End date must be on or after start date.');
      return;
    }

    setSavingUnavailable(true);
    try {
      const dates = buildDateRange(start, end);
      if (!dates.length) return;

      await supabase
        .from('availability')
        .delete()
        .eq('artist_id', targetArtistId)
        .in('unavailable_date', dates as any);

      const rows = dates.map((d) => ({
        artist_id: targetArtistId,
        unavailable_date: d,
        reason: unavailableReason.trim() ? unavailableReason.trim().slice(0, 100) : null,
      }));

      const { error } = await supabase.from('availability').insert(rows as any);
      if (error) throw error;

      setShowUnavailableModal(false);
      setUnavailableReason('');
      await fetchUpcomingEvents();
      Alert.alert('Saved', 'Your unavailable dates were updated.');
    } catch (e: any) {
      console.error('Failed to save unavailable dates:', e);
      Alert.alert('Error', e?.message || 'Could not save unavailable dates.');
    } finally {
      setSavingUnavailable(false);
    }
  };

  const fetchReviews = async () => {
    if (!targetArtistId) return;
    setLoadingReviews(true);
    try {
      const { data, error } = await supabase
        .from('artist_reviews')
        .select('*')
        .eq('artist_id', targetArtistId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const allReviews = data || [];
      setReviews(allReviews);

      if (appUser?.id) {
        const existing = allReviews.find((r: any) => r.user_id === appUser.id);
        setUserReview(existing || null);
      } else {
        setUserReview(null);
      }
    } catch (e) {
      console.error('Error fetching reviews:', e);
      setReviews([]);
      setUserReview(null);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!targetArtistId || !appUser || !newComment.trim() || submittingReview) return;

    try {
      setSubmittingReview(true);

      const reviewerDisplayName =
        (profile as any)?.display_name ||
        (profile as any)?.name ||
        (profile as any)?.username ||
        null;
      const reviewerUsername = (profile as any)?.username || null;
      const reviewerAvatarUrl = (profile as any)?.avatar_url || null;

      const { data: existing, error: existingError } = await supabase
        .from('artist_reviews')
        .select('id')
        .eq('artist_id', targetArtistId)
        .eq('user_id', appUser.id)
        .limit(1);

      if (existingError) throw existingError;

      if (existing && existing.length > 0) {
        Alert.alert('Already reviewed', 'You can only leave one review for this artist.');
        await fetchReviews();
        return;
      }

      const { data, error } = await supabase
        .from('artist_reviews')
        .insert({
          artist_id: targetArtistId,
          user_id: appUser.id,
          rating: newRating,
          comment: newComment.trim(),
          reviewer_display_name: reviewerDisplayName,
          reviewer_username: reviewerUsername,
          reviewer_avatar_url: reviewerAvatarUrl,
        })
        .select()
        .single();

      if (error) throw error;

      const inserted = data as any;
      setNewComment('');
      setNewRating(5);
      setUserReview(inserted);
      setReviews((prev) => [inserted, ...prev]);
    } catch (e: any) {
      console.error('Error submitting review:', e);
      Alert.alert('Error', e?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleUploadAvatar = async () => {
    if (!isOwnProfile) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const filePath = `${user.id}/avatar.jpg`;
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (dbError) throw dbError;

      if (fetchProfile) await fetchProfile();
      setLastUpdate(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleUploadCover = async () => {
    if (!isOwnProfile) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [2, 1], // Standard cover aspect ratio
        quality: 0.8,
      });
      if (result.canceled || !result.assets?.length) return;

      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');

      const filePath = `${user.id}/cover.jpg`;
      const base64 = await FileSystem.readAsStringAsync(result.assets[0].uri, { encoding: 'base64' });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

      const { error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('covers').getPublicUrl(filePath);
      const { error: dbError } = await supabase.from('profiles').update({ cover_url: publicUrl }).eq('user_id', user.id);
      if (dbError) throw dbError;

      if (fetchProfile) await fetchProfile();
      setLastUpdate(Date.now());
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to upload cover image');
    } finally {
      setUploading(false);
    }
  };

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('artist_id', targetArtistId)
        .eq('is_contest_entry', false)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const effectiveProfile = isOwnProfile ? profile : (viewedProfile || artist);
  const isOrganizer = userRole === 'organizer';
  const isArtistViewer = userRole === 'artist';
  const isAdminViewer = userRole === 'admin';
  const displayName = effectiveProfile?.display_name ?? effectiveProfile?.name ?? 'Artist';
  const usernameStr = effectiveProfile?.username ?? '';
  const genresStr = Array.isArray(effectiveProfile?.genres) ? effectiveProfile.genres.join(' • ') : (effectiveProfile?.genres ?? effectiveProfile?.genre ?? '');
  const cityStr = effectiveProfile?.city ?? '';
  const bioStr = effectiveProfile?.bio ?? 'Professional artist.';
  const isBoosted = effectiveProfile?.is_boosted ?? false;

  const dbAvatar =  effectiveProfile?.avatar_url;
  const navAvatar = artist?.profile_image_url ?? artist?.avatar_url ?? artist?.profile_image ?? artist?.profile_image_url;
  const defaultAvatar = 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';
  const rawAvatarUrl = dbAvatar || navAvatar || defaultAvatar;
  const separator = rawAvatarUrl.includes('?') ? '&' : '?';
  const timestamp = isOwnProfile ? lastUpdate : fetchedAt;
  const displayAvatarUrl = `${rawAvatarUrl}${separator}t=${timestamp}`;

  const dbCover = effectiveProfile?.cover_url;
  const defaultCover = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop';
  const rawCoverUrl = dbCover || defaultCover;
  const coverSeparator = rawCoverUrl.includes('?') ? '&' : '?';
  const displayCoverUrl = `${rawCoverUrl}${coverSeparator}t=${timestamp}`;
  const eventsCount = upcomingEvents.length;
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? reviews.reduce((sum, r: any) => sum + (r.rating || 0), 0) / totalReviews
    : 0;

  const handleConnectRequest = async () => {
    if (!appUser) {
      Alert.alert('Login Required', 'Please sign in to connect.');
      return;
    }

    if (!targetArtistId) return;

    try {
      const { data: existing, error: checkError } = await supabase
        .from('message_requests')
        .select('id, status')
        .or(`and(sender_id.eq.${appUser.id},receiver_id.eq.${targetArtistId}),and(sender_id.eq.${targetArtistId},receiver_id.eq.${appUser.id})`)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        setConnectRequestStatus(existing.status as any);
        if (existing.status === 'accepted') {
          navigate('messaging', {
            selectedArtist: effectiveProfile,
            chatId: existing.id,
          });
        } else if (existing.status === 'pending') {
          Alert.alert('Request Pending', 'Your chat request is waiting for approval.');
        } else {
          Alert.alert('Request Rejected', 'This user has declined the chat request.');
        }
        return;
      }

      const { error: createError } = await supabase
        .from('message_requests')
        .insert({
          sender_id: appUser.id,
          receiver_id: targetArtistId,
          status: 'pending',
        });

      if (createError) {
        if ((createError as any)?.code === '23505') {
          setConnectRequestStatus('pending');
          Alert.alert('Request Pending', 'A chat request already exists.');
          return;
        }
        throw createError;
      }

      setConnectRequestStatus('pending');
      Alert.alert('Request Sent', 'Chat request sent. You can message once accepted.');
    } catch (err: any) {
      console.error('Messaging logic error:', err);
      Alert.alert('Error', 'Failed to process chat request.');
    }
  };

  const createProfileReport = async () => {
    if (!appUser?.id || !targetArtistId) {
      Alert.alert('Login required', 'Please sign in to report this profile.');
      return;
    }
    if (appUser.id === targetArtistId) {
      Alert.alert('Invalid action', 'You cannot report your own profile.');
      return;
    }
    if (!reportReason) {
      Alert.alert('Reason required', 'Please select a reason for the report.');
      return;
    }
    try {
      setReportSubmitting(true);
      const { error } = await supabase.from('reports').insert({
        report_type: 'profile',
        target_id: targetArtistId,
        reported_by: appUser.id,
        reason: reportNote.trim() ? `${reportReason}: ${reportNote.trim()}` : reportReason,
        status: 'pending',
      });
      if (error) throw error;
      setShowReportModal(false);
      setReportNote('');
      setReportReason('impersonation');
      Alert.alert('Report submitted', 'Thanks. Our admins will review this profile.');
    } catch (e: any) {
      console.error('Failed to report profile:', e);
      Alert.alert('Error', e?.message || 'Unable to submit report right now.');
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleReportProfile = () => setShowReportModal(true);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 84 : 0}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isOwnProfile ? 140 : 180 }]}
        showsVerticalScrollIndicator={false}
        directionalLockEnabled
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ... (keep existing cover/header code) ... */}
        <Animated.View entering={FadeIn.duration(800)} style={styles.coverWrap}>
          
          <Image source={{ uri: displayCoverUrl }} style={styles.coverImg} resizeMode="cover" />
          
          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={() => navigate(returnTo ?? (isOwnProfile ? 'public-home' : 'search-discover'))}>
            <ChevronLeft size={24} color="#ffffff" />
          </Button>
          {isOwnProfile && (
            <Pressable style={styles.editCoverBtn} onPress={handleUploadCover} disabled={uploading}>
              <Camera size={14} color="#fff" />
              <Text style={styles.editCoverText}>Edit Cover</Text>
            </Pressable>
          )}
          <View style={styles.headerRight}>
            {isOwnProfile && (
              <>
                <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => navigate('edit-profile', { selectedArtist: artist ?? { id: 'me' } })}>
                  <Pencil size={20} color="#ffffff" />
                </Button>
                <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={async () => { await signOut(); navigate('public-home'); }}>
                  <LogOut size={20} color="#FF3B30" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" style={styles.iconBtn} onPress={() => { }}>
              <Share2 size={24} color="#ffffff" />
            </Button>
            {!isOwnProfile && !isAdminViewer && (
              <Pressable
                onPress={handleReportProfile}
                hitSlop={14}
                accessibilityLabel="Report profile"
                accessibilityRole="button"
                style={styles.reportSubtleBtn}
              >
                <Flag size={14} color="#EF4444" />
              </Pressable>
            )}
          </View>
        </Animated.View>

        <Animated.View entering={SlideInDown.duration(600).springify()} style={styles.profileContainer}>
          <Pressable
            style={styles.profileImgContainer}
            onPress={handleUploadAvatar}
            disabled={!isOwnProfile || uploading}
          >
            <Image source={{ uri: displayAvatarUrl }} style={styles.profileImg} />
            {uploading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
            {isOwnProfile && !uploading && (
              <View style={styles.editBadge}>
                <Camera size={16} color="#000" />
              </View>
            )}
          </Pressable>

          <View style={styles.profileHeader}>
            <Animated.View entering={FadeInDown.delay(100).springify()} style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
            </Animated.View>
            {usernameStr ? (
              <View style={styles.usernameWrap}>
                <Badge style={styles.usernamePill}>@{usernameStr}</Badge>
              </View>
            ) : null}
            <View style={styles.meta}>
              <Music size={20} color="#ffffff" />
              <Text style={styles.metaText}>{genresStr || 'Gen Z Artist'}</Text>
            </View>
            {cityStr ? (
              <View style={styles.meta}>
                <MapPin size={16} color="#ffffff" />
                <Text style={styles.metaText}>{cityStr}</Text>
              </View>
            ) : null}
            {isOwnProfile ? (
              <Pressable
                onPress={() => {
                  const today = new Date();
                  setUnavailableStartDate(today);
                  setUnavailableEndDate(today);
                  setUnavailableReason('');
                  setShowUnavailableModal(true);
                }}
                hitSlop={10}
              >
                <Badge style={[styles.availableBadge, hasUnavailableWindow && styles.availableBadgeBlocked]}>
                  {hasUnavailableWindow
                    ? `Unavailable ${formatDateLabel(unavailableRangeStart)} - ${formatDateLabel(unavailableRangeEnd)} (tap to change)`
                    : 'Available for Booking (tap to change)'}
                </Badge>
              </Pressable>
            ) : (
              <Badge style={[styles.availableBadge, hasUnavailableWindow && styles.availableBadgeBlocked]}>
                {hasUnavailableWindow
                  ? unavailableTodayReason
                    ? `Unavailable ${formatDateLabel(unavailableRangeStart)} - ${formatDateLabel(unavailableRangeEnd)} • ${unavailableTodayReason}`
                    : `Unavailable ${formatDateLabel(unavailableRangeStart)} - ${formatDateLabel(unavailableRangeEnd)}`
                  : 'Available for Booking'}
              </Badge>
            )}
          </View>

          <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.actionRow}>
            {isOwnProfile && (
              <Button onPress={() => navigate(userRole === 'organizer' ? 'organizer-dashboard' : 'artist-dashboard')} style={styles.dashboardBtn}>
                <LayoutDashboard size={20} color="#fff" />
                <Text style={styles.bookBtnText} numberOfLines={1} adjustsFontSizeToFit>My Dashboard</Text>
              </Button>
            )}
            {isOrganizer && !isOwnProfile && (
              <>
                <Button onPress={() => navigate('request-booking', { artist: effectiveProfile })} style={styles.bookBtn}>
                  <Calendar size={20} color="#fff" />
                  <Text style={styles.bookBtnText} numberOfLines={1} adjustsFontSizeToFit>Request Booking</Text>
                </Button>
                <Button 
                  variant="outline" 
                  onPress={handleConnectRequest}
                  style={styles.msgBtn}
                >
                  <MessageSquare size={20} color="#fff" />
                </Button>
              </>
            )}
            {isArtistViewer && !isOwnProfile && (
              connectRequestStatus === 'accepted' ? (
                <View style={styles.centeredActionWrap}>
                  <Button variant="outline" onPress={handleConnectRequest} style={styles.msgBtn}>
                    <MessageSquare size={20} color="#fff" />
                  </Button>
                </View>
              ) : (
                <Button style={styles.bookBtn} onPress={handleConnectRequest}>
                  <MessageSquare size={20} color="#fff" />
                  <Text style={styles.bookBtnText} numberOfLines={1} adjustsFontSizeToFit>Connect</Text>
                </Button>
              )
            )}
          </Animated.View>

          <View style={styles.bioCard}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{bioStr || (isOwnProfile ? 'Add your bio in profile setup.' : 'Artist profile.')}</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{eventsCount}</Text>
              <Text style={styles.statLabel}>Upcoming Events</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNum}>{totalReviews > 0 ? averageRating.toFixed(1) : '—'}</Text>
              <Text style={styles.statLabel}>
                {totalReviews > 0 ? `${totalReviews} Review${totalReviews > 1 ? 's' : ''}` : 'No Reviews'}
              </Text>
            </View>
          </View>

          <Tabs defaultValue="videos" fullWidth tabs={[{ value: 'videos', label: 'Videos' }, { value: 'schedule', label: 'Schedule' }, { value: 'reviews', label: 'Reviews' }]}>
            {(tab) => tab === 'videos' ? (
              <View style={styles.videoGrid}>
                {isOwnProfile && (
                  <Button
                    onPress={() => navigate('upload-video')}
                    style={[styles.emptyPrimaryBtn, { marginBottom: 16 }]}
                    disabled={loadingVideos}
                  >
                    <Video size={20} color="#162447" />
                    <Text style={styles.emptyPrimaryBtnText}>Upload Video</Text>
                  </Button>
                )}
                {loadingVideos ? (
                  <ActivityIndicator color="#a855f7" style={{ marginTop: 20 }} />
                ) : videos.length > 0 ? (
                  videos.map((v) => (
                    <Pressable
                      key={v.video_id}
                      style={styles.videoItem}
                      onPress={() => openVideoFeed(videos.findIndex((x) => x.video_id === v.video_id))}
                    >
                      <Image
                        source={{ uri: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop' }}
                        style={styles.videoThumb}
                        contentFit="cover"
                        transition={200}
                        cachePolicy="memory-disk"
                      />
                      
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={1}>{v.title || 'Untitled'}</Text>
                        <Text style={styles.videoViews}>{v.views_count?.toLocaleString() ?? 0} views</Text>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyBento}>
                    <View style={styles.emptyIconCircle}>
                      <Video size={40} color="#FDF2FF" />
                    </View>
                    <Text style={styles.emptyTitle}>Share Your Art</Text>
                    <Text style={styles.emptyDesc}>Upload your first performance to build your audience and get discovered.</Text>
                  </View>
                )}
              </View>
            ) : tab === 'schedule' ? (
              <View style={styles.scheduleCard}>
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    onPress={() => navigate('manage-availability')}
                    style={{ marginBottom: 12, alignSelf: 'flex-start', minWidth: 170, minHeight: 40, paddingHorizontal: 14 }}
                    textStyle={{ fontSize: 14, fontWeight: '600' }}
                  >
                    Manage Schedule
                  </Button>
                )}
                {loadingEvents ? (
                  <ActivityIndicator color="#a855f7" style={{ marginVertical: 24 }} />
                ) : upcomingEvents.length === 0 ? (
                  <View style={styles.emptySchedule}>
                    <Calendar size={40} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.emptyScheduleText}>No upcoming events</Text>
                  </View>
                ) : (
                  upcomingEvents.map((ev) => (
                    <Pressable
                      key={ev.id}
                      style={styles.scheduleRow}
                      onPress={() => {
                        if (ev.eventId) navigate('event-details', { eventId: ev.eventId });
                      }}
                      disabled={!ev.eventId}
                    >
                      <Calendar size={20} color="#a855f7" />
                      <View style={styles.scheduleInfo}>
                        <Text style={styles.scheduleTitle}>{ev.title}</Text>
                        <Text style={styles.scheduleMeta}>
                          {new Date(ev.date + 'T12:00:00').toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                          {ev.time ? ` • ${ev.time}` : ''}
                          {ev.venue ? ` • ${ev.venue}` : ''}
                        </Text>
                        {ev.source === 'booking' && ev.status && (
                          <Badge style={styles.scheduleBadge}>{ev.status}</Badge>
                        )}
                        {ev.source === 'unavailable' && (
                          <Badge style={styles.unavailableBadge}>Blocked</Badge>
                        )}
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {loadingReviews ? (
                  <ActivityIndicator color="#a855f7" style={{ marginVertical: 24 }} />
                ) : (
                  <>
                    {reviews.length === 0 ? (
                      <View style={styles.reviewCard}>
                        <Text style={styles.reviewText}>No reviews yet.</Text>
                      </View>
                    ) : (
                      reviews.map((r: any) => (
                        <View key={r.id} style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <Image
                              source={{ uri: r.reviewer_avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }}
                              style={styles.reviewAvatar}
                            />
                            <View style={styles.reviewMeta}>
                              <Text style={styles.reviewer}>
                                {r.user_id === appUser?.id
                                  ? 'Your Review'
                                  : r.reviewer_display_name || (r.reviewer_username ? `@${r.reviewer_username}` : 'Reviewer')}
                              </Text>
                              <View style={styles.stars}>
                                {[1, 2, 3, 4, 5].map((i) => (
                                  <Star
                                    key={i}
                                    size={16}
                                    color={i <= (r.rating || 0) ? '#facc15' : 'rgba(255,255,255,0.25)'}
                                    fill={i <= (r.rating || 0) ? '#facc15' : 'transparent'}
                                  />
                                ))}
                              </View>
                            </View>
                            <Text style={styles.reviewTime}>
                              {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}
                            </Text>
                          </View>
                          <Text style={styles.reviewText}>{r.comment}</Text>
                        </View>
                      ))
                    )}
                  </>
                )}

                {!isOwnProfile && appUser && !userReview && (
                  <View style={styles.reviewCard}>
                    <Text style={[styles.reviewer, { marginBottom: 10 }]}>Add a Review</Text>
                    <View style={[styles.stars, { marginBottom: 12 }]}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Pressable key={i} onPress={() => setNewRating(i)} style={{ padding: 4 }}>
                          <Star
                            size={20}
                            color={i <= newRating ? '#facc15' : 'rgba(255,255,255,0.25)'}
                            fill={i <= newRating ? '#facc15' : 'transparent'}
                          />
                        </Pressable>
                      ))}
                    </View>
                    <Textarea
                      value={newComment}
                      onChangeText={setNewComment}
                      placeholder="Share your experience with this artist..."
                      style={{ color: '#fff', marginBottom: 12 }}
                    />
                    <Button
                      onPress={handleSubmitReview}
                      disabled={submittingReview || !newComment.trim()}
                      style={styles.dashboardBtn}
                    >
                      <Text style={styles.bookBtnText}>{submittingReview ? 'Submitting...' : 'Submit Review'}</Text>
                    </Button>
                  </View>
                )}
              </View>
            )}
          </Tabs>
        </Animated.View>
      </ScrollView>
      {isOwnProfile && (
        <BottomNav activeTab="profile" navigate={navigate} userRole={userRole} isAuthenticated />
      )}

      <Modal visible={videoFeedVisible} animationType="slide" statusBarTranslucent>
        <View style={styles.videoFeedModal}>
          <View style={styles.videoFeedHeader} pointerEvents="box-none">
            <Button variant="ghost" size="icon" onPress={() => setVideoFeedVisible(false)} style={styles.videoFeedBackBtn}>
              <ChevronLeft size={24} color="#fff" />
            </Button>
          </View>
          <FlatList
            ref={videoListRef}
            data={videos}
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
              const profileForFeed =
                effectiveProfile && targetArtistId
                  ? {
                      user_id: targetArtistId,
                      display_name: effectiveProfile.display_name,
                      username: effectiveProfile.username,
                      avatar_url: effectiveProfile.avatar_url,
                      genres: effectiveProfile.genres,
                      city: effectiveProfile.city,
                      is_boosted: effectiveProfile.is_boosted,
                    }
                  : undefined;
              const feedItem = profileForFeed ? { ...item, profiles: profileForFeed } : item;
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

      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => setShowReportModal(false)}>
        <View style={styles.reportModalBackdrop}>
          <View style={styles.reportModalCard}>
            <Text style={styles.reportModalTitle}>Report Profile</Text>
            <Text style={styles.reportModalSubtitle}>Help us understand what is wrong with this account.</Text>
            <View style={styles.reportReasonWrap}>
              {[
                { id: 'impersonation', label: 'Impersonation' },
                { id: 'harassment', label: 'Harassment' },
                { id: 'spam', label: 'Spam' },
                { id: 'inappropriate_profile', label: 'Inappropriate' },
              ].map((r) => (
                <Pressable
                  key={r.id}
                  style={[styles.reportReasonChip, reportReason === r.id && styles.reportReasonChipActive]}
                  onPress={() => setReportReason(r.id)}
                >
                  <Text style={[styles.reportReasonText, reportReason === r.id && styles.reportReasonTextActive]}>{r.label}</Text>
                </Pressable>
              ))}
            </View>
            <Textarea
              placeholder="Add note (optional)"
              value={reportNote}
              onChangeText={setReportNote}
              style={styles.reportModalNoteInput}
            />
            <View style={styles.reportModalActions}>
              <Button variant="outline" style={styles.reportModalCancelBtn} onPress={() => setShowReportModal(false)} disabled={reportSubmitting}>
                <Text style={styles.reportModalCancelText}>Cancel</Text>
              </Button>
              <Button style={styles.reportModalSubmitBtn} onPress={createProfileReport} disabled={reportSubmitting}>
                <Text style={styles.reportModalSubmitText}>{reportSubmitting ? 'Submitting...' : 'Submit Report'}</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showUnavailableModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.reportModalBackdrop}>
          <View style={styles.reportModalCard}>
            <Text style={styles.reportModalTitle}>Set Unavailable Dates</Text>
            <Text style={styles.reportModalSubtitle}>Block a date range for bookings.</Text>

            <Text style={styles.reportLabel}>Start date</Text>
            <Pressable
              style={styles.datePickerBtn}
              onPress={() => setShowUnavailableStartPicker(true)}
              disabled={savingUnavailable}
            >
              <Text style={styles.datePickerText}>{unavailableStartDate.toLocaleDateString()}</Text>
            </Pressable>
            {showUnavailableStartPicker && (
              <DateTimePicker
                value={unavailableStartDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={new Date()}
                onChange={(_event, selected) => {
                  setShowUnavailableStartPicker(Platform.OS === 'ios');
                  if (selected) {
                    setUnavailableStartDate(selected);
                    if (selected.getTime() > unavailableEndDate.getTime()) {
                      setUnavailableEndDate(selected);
                    }
                  }
                }}
              />
            )}

            <Text style={styles.reportLabel}>End date</Text>
            <Pressable
              style={styles.datePickerBtn}
              onPress={() => setShowUnavailableEndPicker(true)}
              disabled={savingUnavailable}
            >
              <Text style={styles.datePickerText}>{unavailableEndDate.toLocaleDateString()}</Text>
            </Pressable>
            {showUnavailableEndPicker && (
              <DateTimePicker
                value={unavailableEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                minimumDate={unavailableStartDate}
                onChange={(_event, selected) => {
                  setShowUnavailableEndPicker(Platform.OS === 'ios');
                  if (selected) setUnavailableEndDate(selected);
                }}
              />
            )}

            <Text style={styles.reportLabel}>Reason (optional)</Text>
            <Textarea
              placeholder="Vacation, travel, personal commitments..."
              value={unavailableReason}
              onChangeText={setUnavailableReason}
              style={styles.reportModalNoteInput}
            />

            <View style={styles.reportModalActions}>
              <Button
                variant="outline"
                style={styles.reportModalCancelBtn}
                onPress={() => setShowUnavailableModal(false)}
                disabled={savingUnavailable}
              >
                <Text style={styles.reportModalCancelText}>Cancel</Text>
              </Button>
              <Button style={styles.reportModalSubmitBtn} onPress={saveUnavailableRange} disabled={savingUnavailable}>
                <Text style={styles.reportModalSubmitText}>
                  {savingUnavailable ? 'Saving...' : 'Save'}
                </Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  scroll: { backgroundColor: '#050A18' },
  coverWrap: { height: 320, backgroundColor: '#0d141d', borderRadius: 40, marginHorizontal: 16, marginTop: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' }, 
  coverImg: { width: '100%', height: '100%' },
  backBtn: { position: 'absolute', top: 32, left: 16, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8, zIndex: 50, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  headerRight: { position: 'absolute', top: 32, right: 16, flexDirection: 'row', gap: 12, zIndex: 50 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  profileContainer: { paddingHorizontal: 16, marginTop: -40, zIndex: 10 },
  profileImgContainer: { alignSelf: 'center', width: 120, height: 120, borderRadius: 60, borderWidth: 6, borderColor: '#050A18', backgroundColor: '#0d141d', zIndex: 10 },
  profileImg: { width: '100%', height: '100%', borderRadius: 60 },
  profileHeader: { alignItems: 'center', marginTop: 16, marginBottom: 16, paddingHorizontal: 16 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  name: { fontSize: 44, fontWeight: '800', color: '#ffffff', letterSpacing: -1.5 },
  usernameWrap: { width: '100%', alignItems: 'center' },
  usernamePill: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 6, marginBottom: 16, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  boostedBadge: { backgroundColor: '#FDF2FF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  metaText: { color: '#8E8E93', fontSize: 16, fontWeight: '600' },
  availableBadge: { backgroundColor: 'rgba(253,242,255,0.15)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(253,242,255,0.3)' },
  availableBadgeBlocked: { backgroundColor: 'rgba(239,68,68,0.18)', borderColor: 'rgba(239,68,68,0.35)' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24, paddingHorizontal: 16 },
  bookBtn: { flex: 1, minWidth: 200, backgroundColor: '#FDF2FF', flexDirection: 'row', gap: 8, borderRadius: 100, paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  dashboardBtn: { flex: 1, minWidth: 200, backgroundColor: '#FDF2FF', flexDirection: 'row', gap: 8, borderRadius: 100, paddingVertical: 20, justifyContent: 'center', alignItems: 'center' },
  bookBtnText: { color: '#162447', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  msgBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, width: 64, height: 64, justifyContent: 'center', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  reportSubtleBtn: {
    padding: 6,
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredActionWrap: { width: '100%', alignItems: 'center' },
  bioCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 32, marginBottom: 16, borderRadius: 40, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  bioTitle: { color: '#8E8E93', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  bioText: { color: '#dce3f0', lineHeight: 28, fontSize: 18, fontWeight: '500' },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },

  toggleContainer: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, padding: 4, marginHorizontal: 16, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  togglePill: { flex: 1, paddingVertical: 12, borderRadius: 100, alignItems: 'center' },
  togglePillActive: { backgroundColor: '#FDF2FF', shadowColor: '#FDF2FF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12 },
  toggleText: { color: '#8E8E93', fontWeight: '600', fontSize: 15 },
  toggleTextActive: { color: '#162447', fontWeight: '800' },
  
  statCard: { flex: 1, minWidth: 100, paddingVertical: 32, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 40, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  statNum: { fontSize: 32, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  statLabel: { color: '#8E8E93', fontSize: 12, marginTop: 6, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  scheduleCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 32, borderRadius: 40, marginTop: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  scheduleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, paddingVertical: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
  scheduleInfo: { flex: 1 },
  scheduleTitle: { color: '#ffffff', fontWeight: '700', fontSize: 18 },
  scheduleMeta: { color: '#8E8E93', fontSize: 15, marginTop: 6, fontWeight: '500' },
  scheduleBadge: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  unavailableBadge: { marginTop: 12, alignSelf: 'flex-start', backgroundColor: 'rgba(34,211,238,0.16)', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  emptySchedule: { alignItems: 'center', padding: 48 },
  emptyScheduleText: { color: '#8E8E93', fontSize: 16, marginTop: 16, fontWeight: '600' },
  reportLabel: { color: '#fff', fontWeight: '700', marginBottom: 8, marginTop: 4 },
  datePickerBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  datePickerText: { color: '#fff', fontWeight: '700' },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 32, borderRadius: 40, marginTop: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  reviewAvatar: { width: 44, height: 44, borderRadius: 22 },
  reviewMeta: { flex: 1 },
  reviewer: { color: '#ffffff', fontWeight: '700', fontSize: 17 },
  stars: { flexDirection: 'row', gap: 4, marginTop: 4 },
  reviewTime: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  reviewText: { color: '#dce3f0', fontSize: 17, lineHeight: 26, fontWeight: '500' },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 16 },
  videoItem: { width: '47%', aspectRatio: 9 / 16, borderRadius: 24, overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(255,255,255,0.02)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  videoThumb: { width: '100%', height: '100%', opacity: 0.9 },
  videoInfo: { position: 'absolute', bottom: 16, left: 16, right: 16 },
  videoTitle: { color: '#ffffff', fontWeight: '700', fontSize: 14, marginBottom: 6 },
  videoViews: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
  videoFeedModal: { flex: 1, backgroundColor: '#050A18' },
  videoFeedHeader: { position: 'absolute', top: 56, left: 16, zIndex: 10 },
  videoFeedBackBtn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 24, padding: 8 },
  signOutBtn: { flexDirection: 'row', gap: 8, marginTop: 16, backgroundColor: 'rgba(255,59,48,0.1)', borderRadius: 100, paddingVertical: 20, justifyContent: 'center' },
  signOutText: { color: '#FF3B30', fontSize: 16, fontWeight: '700' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,10,24,0.8)', justifyContent: 'center', alignItems: 'center', borderRadius: 40 },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FDF2FF', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#050A18' },
  editCoverBtn: { position: 'absolute', bottom: 16, right: 16, backgroundColor: 'rgba(5,10,24,0.8)', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.2)' },
  editCoverText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#8E8E93', fontSize: 15 },
  emptyBento: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 40,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.1)',
    marginTop: 16,
    width: '100%',
  },
  emptyIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(253, 242, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(253, 242, 255, 0.15)',
  },
  emptyTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -1,
    marginBottom: 12,
  },
  emptyDesc: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  emptyPrimaryBtn: {
    backgroundColor: '#FDF2FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 100,
    width: '100%',
  },
  emptyPrimaryBtnText: {
    color: '#162447',
    fontSize: 17,
    fontWeight: '800',
  },
  reportModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  reportModalCard: {
    backgroundColor: '#0B1220',
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    padding: 16,
  },
  reportModalTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  reportModalSubtitle: { color: 'rgba(255,255,255,0.62)', marginTop: 4, marginBottom: 12 },
  reportReasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  reportReasonChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  reportReasonChipActive: {
    backgroundColor: 'rgba(34,211,238,0.18)',
    borderColor: 'rgba(34,211,238,0.45)',
  },
  reportReasonText: { color: 'rgba(255,255,255,0.78)', fontSize: 13, fontWeight: '600' },
  reportReasonTextActive: { color: '#CFFAFE' },
  reportModalNoteInput: { marginBottom: 12 },
  reportModalActions: { flexDirection: 'row', gap: 8 },
  reportModalCancelBtn: { flex: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.04)' },
  reportModalSubmitBtn: { flex: 1, backgroundColor: '#FDF2FF' },
  reportModalCancelText: { color: '#fff', fontWeight: '700' },
  reportModalSubmitText: { color: '#162447', fontWeight: '800' },
});
