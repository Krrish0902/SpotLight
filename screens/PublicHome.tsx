import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import BottomNav from '../components/layout/BottomNav';
import { VideoFeedItem, VideoFeedItemData } from '../components/VideoFeedItem';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const { width, height } = Dimensions.get('window');

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function PublicHome({ navigate }: Props) {
  const { appUser } = useAuth();
  const isAuthenticated = !!appUser;
  const [videos, setVideos] = useState<VideoFeedItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const fetchVideos = async () => {
    try {
      // Direct join videos -> profiles (enabled by Foreign Key)
      const { data, error } = await supabase
        .from('videos')
        .select(`
          video_id,
          video_url,
          thumbnail_url,
          title,
          description,
          likes_count,
          views_count,
          upload_date,
          artist_id,
          profiles!inner (
            user_id,
            display_name,
            username,
            genres,
            city,
            is_boosted
          )
        `)
        .order('upload_date', { ascending: false });

      if (error) throw error;

      const validVideos: VideoFeedItemData[] = (data || []).map((v: any) => {
        // Handle if profiles is returned as array or object
        const profile = Array.isArray(v.profiles) ? v.profiles[0] : v.profiles;
        return {
          ...v,
          profiles: profile,
        };
      });

      setVideos(validVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const renderItem = ({ item, index }: { item: VideoFeedItemData; index: number }) => {
    const profile = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
    return (
      <VideoFeedItem
        item={item}
        isActive={index === activeIndex}
        muted={muted}
        onToggleMute={() => setMuted((m) => !m)}
        showProfileOverlay
        onProfilePress={() => navigate('artist-profile', { selectedArtist: { user_id: item.artist_id, ...profile }, returnTo: 'public-home' })}
      />
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <FlatList
        ref={flatListRef}
        data={videos}
        renderItem={renderItem}
        keyExtractor={(item) => item.video_id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        getItemLayout={(_data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        ListEmptyComponent={
          <View style={[styles.centerContainer, { height }]}>
            <Text style={{ color: '#fff' }}>No videos found.</Text>
            <Button variant="outline" onPress={fetchVideos} style={{ marginTop: 20 }}>Refresh</Button>
          </View>
        }
      />
      <BottomNav activeTab="home" navigate={navigate} userRole={appUser?.role} isAuthenticated={isAuthenticated} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
