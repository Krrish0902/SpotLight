import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, FlatList, ActivityIndicator, StatusBar } from 'react-native';
import { Text } from '../components/ui/Text';
import { Button } from '../components/ui/Button';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { HingeArtistProfile, HingeProfileData } from '../components/HingeArtistProfile';
import { colors } from '../theme';
import { useSendbirdChat } from '@sendbird/uikit-react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function PublicHome({ navigate }: Props) {
  const { appUser } = useAuth();
  const isAuthenticated = !!appUser;
  const [profiles, setProfiles] = useState<HingeProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  
  const { sdk } = useSendbirdChat();

  const fetchProfilesWithVideos = async () => {
    try {
      setLoading(true);
      setErrorState(null);

      // 1. Fetch random/recent profiles directly (bypassing `users` table due to RLS blocks)
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      if (profilesErr) throw profilesErr;
      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const userIds = profilesData.map(p => p.user_id);

      // 2. Fetch their videos
      const { data: videosData, error: videosErr } = await supabase
        .from('videos')
        .select('*')
        .in('artist_id', userIds)
        .order('upload_date', { ascending: false });

      if (videosErr) throw videosErr;

      // Combine them
      const combinedProfiles: HingeProfileData[] = profilesData.map(p => {
        const artistVideos = (videosData || []).filter(v => v.artist_id === p.user_id);
        return {
          user_id: p.user_id,
          display_name: p.display_name,
          username: p.username,
          bio: p.bio,
          city: p.city,
          genres: p.genres,
          avatar_url: p.avatar_url,
          cover_url: p.cover_url,
          videos: artistVideos.map(v => ({
            video_id: v.video_id,
            video_url: v.video_url,
            thumbnail_url: v.thumbnail_url,
            title: v.title,
            description: v.description,
          })),
        };
      });

      setProfiles(combinedProfiles);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      setErrorState(err.message || 'Failed to load profiles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfilesWithVideos();
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const handleLike = async (profile: HingeProfileData) => {
    if (!isAuthenticated) {
      // Prompt login first
      navigate('login-signup', { returnTo: 'public-home', defaultTab: 'signup' });
      return;
    }

    try {
      // Create a 1-on-1 distinct group channel with the liked artist
      const params = {
        invitedUserIds: [profile.user_id],
        isDistinct: true,
        name: `${appUser?.email?.split('@')[0]} & ${profile.display_name}`,
      };
      
      const channel = await sdk.groupChannel.createChannel(params);
      
      // Navigate to messaging/chat with this artist, passing the channel URL
      navigate('messaging', {
        channelUrl: channel.url,
        artist: profile,
        returnTo: 'public-home',
      });
    } catch (err) {
      console.error('Failed to create Sendbird channel:', err);
    }
  };

  const handleReject = () => {
    // Skip logic -> go next
    if (activeIndex < profiles.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    }
  };

  const handleOptionsPress = (profile: HingeProfileData) => {
    navigate('artist-profile', { selectedArtist: { ...profile }, returnTo: 'public-home' });
  };

  const renderItem = ({ item, index }: { item: HingeProfileData; index: number }) => {
    return (
      <View style={{ width, height: height }}>
        <HingeArtistProfile
          profile={item}
          isActive={index === activeIndex}
          onLike={() => handleLike(item)}
          onReject={handleReject}
          onOptionsPress={() => handleOptionsPress(item)}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        ref={flatListRef}
        data={profiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        ListEmptyComponent={
          <View style={[styles.centerContainer, { width }]}>
            {errorState ? (
              <View style={{ paddingHorizontal: 32, alignItems: 'center' }}>
                <Text style={{ color: '#ef4444', textAlign: 'center', marginBottom: 12, fontWeight: 'bold' }}>Network Error</Text>
                <Text style={{ color: colors.foreground, textAlign: 'center', opacity: 0.8 }}>{errorState}</Text>
              </View>
            ) : (
              <Text style={{ color: colors.foreground }}>No artists found.</Text>
            )}
            <Button variant="outline" onPress={fetchProfilesWithVideos} style={{ marginTop: 20 }}>Refresh Feed</Button>
          </View>
        }
      />
      <BottomNav activeTab="home" navigate={navigate} userRole={appUser?.role} isAuthenticated={isAuthenticated} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centerContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
