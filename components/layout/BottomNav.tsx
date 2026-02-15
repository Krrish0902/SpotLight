import React from 'react';
import { View, Pressable, StyleSheet, Platform } from 'react-native';
import { Text } from '../ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Calendar, User } from 'lucide-react-native';
import { colors } from '../../theme';

interface BottomNavProps {
  activeTab: string;
  navigate: (screen: string, data?: any) => void;
  userRole?: string;
  isAuthenticated?: boolean;
}

const tabs = [
  { id: 'home', Icon: Home, label: 'Home' },
  { id: 'search', Icon: Search, label: 'Discover' },
  { id: 'events', Icon: Calendar, label: 'Events' },
  { id: 'profile', Icon: User, label: 'Profile' },
];

export default function BottomNav({ activeTab, navigate, userRole = 'public', isAuthenticated = false }: BottomNavProps) {
  const insets = useSafeAreaInsets();

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') {
      navigate('public-home');
      return;
    }
    if (tabId === 'search') {
      navigate('search-discover');
      return;
    }
    if (tabId === 'events') {
      navigate('events-grid');
      return;
    }
    if (tabId === 'profile') {
      if (isAuthenticated && (userRole === 'artist' || userRole === 'organizer')) {
        navigate('artist-profile', { selectedArtist: { id: 'me' } });
      } else if (isAuthenticated && userRole === 'admin') {
        navigate('admin-dashboard');
      } else {
        navigate('login-signup', { returnTo: 'public-home' });
      }
      return;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.content}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={styles.tab}
            >
              <Icon
                size={24}
                color={isActive ? colors.purple[400] : colors['white/60']}
                strokeWidth={2}
              />
              <Text
                style={[
                  styles.label,
                  { color: isActive ? colors.purple[400] : colors['white/60'] },
                  isActive && styles.labelActive,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 12,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
  },
  labelActive: {
    fontWeight: '600',
  },
});
