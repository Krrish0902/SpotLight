import React from 'react';
import { View, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, Heart, MessageCircle, User } from 'lucide-react-native';
import { colors } from '../../theme';

interface BottomNavProps {
  activeTab: string;
  navigate: (screen: string, data?: any) => void;
  userRole?: string;
  isAuthenticated?: boolean;
}

const tabs = [
  { id: 'home', Icon: null, isLogo: true }, // Custom logo for home
  { id: 'search', Icon: Star },
  { id: 'events', Icon: Heart },
  { id: 'messages', Icon: MessageCircle },
  { id: 'profile', Icon: User },
];

export default function BottomNav({ activeTab, navigate, userRole = 'public', isAuthenticated = false }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') navigate('public-home');
    if (tabId === 'search') navigate('search-discover');
    if (tabId === 'events') navigate('events-grid');
    if (tabId === 'messages') {
      if (!isAuthenticated) navigate('login-signup', { returnTo: 'matches' });
      else navigate('matches');
    }
    if (tabId === 'profile') {
      if (isAuthenticated && (userRole === 'artist' || userRole === 'organizer')) {
        navigate('artist-profile', { selectedArtist: { id: 'me' } });
      } else if (isAuthenticated && userRole === 'admin') {
        navigate('admin-dashboard');
      } else {
        navigate('login-signup', { returnTo: 'public-home' });
      }
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.content}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const iconColor = isActive ? colors.primary : '#666666';
          const IconComponent = tab.Icon as any;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tab}
            >
              {tab.isLogo ? (
                <View style={styles.logoContainer}>
                  <Text style={[styles.logoText, { color: iconColor }]}>H</Text>
                </View>
              ) : (
                <IconComponent size={28} color={iconColor} strokeWidth={isActive ? 2.5 : 2} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Simple Text component for the logo if we aren't importing the main Text component
import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111111', // Very dark grey/black
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  logoContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: -1,
  }
});
