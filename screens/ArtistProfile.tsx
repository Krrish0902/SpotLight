import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Share2, MapPin, Music, Calendar, MessageSquare, Star } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Video {
  video_id: string;
  thumbnail_url: string;
  title: string;
  views_count: number;
}

interface Props {
  navigate: (screen: string, data?: any) => void;
  artist?: any;
  userRole?: string;
}

export default function ArtistProfile({ navigate, artist, userRole = 'public' }: Props) {
  const { profile, appUser } = useAuth(); // Access appUser for ID if profile is missing
  const isOwnProfile = artist?.id === 'me' || (appUser && artist?.user_id === appUser.id);

  // Determine the ID to fetch videos for
  const targetArtistId = isOwnProfile ? appUser?.id : artist?.user_id;

  const [videos, setVideos] = useState<Video[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  useEffect(() => {
    if (targetArtistId) {
      fetchVideos();
    }
  }, [targetArtistId]);

  const fetchVideos = async () => {
    setLoadingVideos(true);
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('artist_id', targetArtistId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoadingVideos(false);
    }
  };

  const isOrganizer = userRole === 'organizer';
  const displayName = isOwnProfile ? (profile?.display_name ?? 'Artist') : (artist?.display_name ?? artist?.name ?? 'Artist');
  const genresStr = isOwnProfile ? (profile?.genres?.join(' • ') ?? '') : (artist?.genres?.join(' • ') ?? artist?.genre ?? '');
  const cityStr = isOwnProfile ? (profile?.city ?? '') : (artist?.city ?? '');
  const bioStr = isOwnProfile ? (profile?.bio ?? '') : (artist?.bio ?? 'Professional artist.');
  const isBoosted = isOwnProfile ? (profile?.is_boosted ?? false) : (artist?.is_boosted ?? false);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isOwnProfile ? 120 : 48 }]} showsVerticalScrollIndicator={false}>
        {/* ... (keep existing cover/header code) ... */}
        <View style={styles.coverWrap}>
          <LinearGradient colors={['#9333ea', '#db2777', '#f97316']} style={StyleSheet.absoluteFill} />
          <Image source={{ uri: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=400&fit=crop' }} style={StyleSheet.absoluteFill} />
          <Button variant="ghost" size="icon" style={styles.backBtn} onPress={() => navigate(isOwnProfile ? (userRole === 'organizer' ? 'organizer-dashboard' : 'artist-dashboard') : 'search-discover')}>
            <ChevronLeft size={24} color="#fff" />
          </Button>
          <Button variant="ghost" size="icon" style={styles.shareBtn} onPress={() => { }}>
            <Share2 size={24} color="#fff" />
          </Button>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.profileImg} />
        </View>

        <View style={styles.content}>
          <View style={styles.profileHeader}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{displayName}</Text>
              {isBoosted && <Badge icon={<Star size={12} color="#fff" fill="#fff" />} style={styles.boostedBadge}>Boosted</Badge>}
            </View>
            <View style={styles.meta}>
              <Music size={20} color="#fff" />
              <Text style={styles.metaText}>{genresStr || 'Gen Z Artist'}</Text>
            </View>
            {cityStr ? (
              <View style={styles.meta}>
                <MapPin size={16} color="#fff" />
                <Text style={styles.metaText}>{cityStr}</Text>
              </View>
            ) : null}
            <Badge style={styles.availableBadge}>Available for Booking</Badge>
          </View>

          <View style={styles.actionRow}>
            {isOrganizer && (
              <>
                <Button onPress={() => navigate('request-booking', { selectedArtist: artist })} style={styles.bookBtn}>
                  <Calendar size={20} color="#fff" />
                  <Text style={styles.bookBtnText}>Request Booking</Text>
                </Button>
                <Button variant="outline" onPress={() => navigate('messaging', { selectedArtist: artist })} style={styles.msgBtn}>
                  <MessageSquare size={20} color="#fff" />
                </Button>
              </>
            )}
            {!isOrganizer && !isOwnProfile && (
              <Button style={styles.bookBtn}><Text style={styles.bookBtnText}>Follow</Text></Button>
            )}
          </View>

          <Card style={styles.bioCard}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{bioStr || (isOwnProfile ? 'Add your bio in profile setup.' : 'Artist profile.')}</Text>
          </Card>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}><Text style={styles.statNum}>2.8K</Text><Text style={styles.statLabel}>Followers</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNum}>142</Text><Text style={styles.statLabel}>Events</Text></Card>
            <Card style={styles.statCard}><Text style={styles.statNum}>4.9</Text><Text style={styles.statLabel}>Rating</Text></Card>
          </View>

          <Tabs defaultValue="videos" tabs={[{ value: 'videos', label: 'Videos' }, { value: 'availability', label: 'Availability' }, { value: 'reviews', label: 'Reviews' }]}>
            {(tab) => tab === 'videos' ? (
              <View style={styles.videoGrid}>
                {loadingVideos ? (
                  <ActivityIndicator color="#a855f7" style={{ marginTop: 20 }} />
                ) : videos.length > 0 ? (
                  videos.map((v) => (
                    <View key={v.video_id} style={styles.videoItem}>
                      <Image
                        source={{ uri: v.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=600&fit=crop' }}
                        style={styles.videoThumb}
                        resizeMode="cover"
                      />
                      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.5)', '#000']} style={[StyleSheet.absoluteFill, styles.videoOverlay]} />
                      <View style={styles.videoInfo}>
                        <Text style={styles.videoTitle} numberOfLines={1}>{v.title || 'Untitled'}</Text>
                        <Text style={styles.videoViews}>{v.views_count?.toLocaleString() ?? 0} views</Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No videos uploaded yet.</Text>
                    {isOwnProfile && (
                      <Button variant="outline" onPress={() => navigate('upload-video')} style={{ marginTop: 12 }}>
                        <Text style={{ color: '#fff' }}>Upload Video</Text>
                      </Button>
                    )}
                  </View>
                )}
              </View>
            ) : tab === 'availability' ? (
              <Card style={styles.availCard}>
                {['Feb 15, 2026', 'Feb 20-22, 2026', 'Mar 5, 2026'].map((d, i) => (
                  <View key={i} style={styles.availRow}>
                    <Calendar size={20} color="#a855f7" />
                    <Text style={styles.availDate}>{d}</Text>
                    <Badge style={styles.availBadge}>Available</Badge>
                  </View>
                ))}
              </Card>
            ) : (
              <Card style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }} style={styles.reviewAvatar} />
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewer}>John Smith</Text>
                    <View style={styles.stars}>{[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} color="#facc15" fill="#facc15" />)}</View>
                  </View>
                  <Text style={styles.reviewTime}>2 days ago</Text>
                </View>
                <Text style={styles.reviewText}>Amazing performance! Maya brought our wedding to life with her incredible voice and stage presence.</Text>
              </Card>
            )}
          </Tabs>
        </View>
      </ScrollView>
      {isOwnProfile && (
        <BottomNav activeTab="profile" navigate={navigate} userRole={userRole} isAuthenticated />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scroll: {},
  coverWrap: { height: 192, position: 'relative' },
  backBtn: { position: 'absolute', top: 48, left: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  shareBtn: { position: 'absolute', top: 48, right: 16, backgroundColor: 'rgba(0,0,0,0.4)' },
  profileImg: { position: 'absolute', bottom: -64, left: 24, width: 128, height: 128, borderRadius: 64, borderWidth: 4, borderColor: '#030712' },
  content: { padding: 24, paddingTop: 80 },
  profileHeader: { marginBottom: 24 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  name: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  boostedBadge: { backgroundColor: '#a855f7' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  metaText: { color: 'rgba(255,255,255,0.8)', fontSize: 16 },
  availableBadge: { backgroundColor: 'rgba(34,197,94,0.2)', marginTop: 12, borderColor: 'rgba(34,197,94,0.3)' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  bookBtn: { flex: 1, backgroundColor: '#a855f7', flexDirection: 'row', gap: 8 },
  bookBtnText: { color: '#fff' },
  msgBtn: { borderColor: 'rgba(255,255,255,0.2)' },
  bioCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, marginBottom: 24 },
  bioTitle: { color: '#fff', fontWeight: '600', marginBottom: 8 },
  bioText: { color: 'rgba(255,255,255,0.7)', lineHeight: 22 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 4 },
  videoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  videoItem: { width: '47%', aspectRatio: 9 / 16, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  videoThumb: { width: '100%', height: '100%' },
  videoOverlay: { bottom: 0 },
  videoInfo: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  videoTitle: { color: '#fff', fontWeight: '500', fontSize: 14 },
  videoViews: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  availCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  availRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  availDate: { flex: 1, color: '#fff' },
  availBadge: { backgroundColor: 'rgba(34,197,94,0.2)', borderWidth: 0 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 16 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20 },
  reviewMeta: { flex: 1 },
  reviewer: { color: '#fff', fontWeight: '500' },
  stars: { flexDirection: 'row', gap: 2 },
  reviewTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
  reviewText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 20 },
  emptyState: { width: '100%', alignItems: 'center', padding: 32 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
