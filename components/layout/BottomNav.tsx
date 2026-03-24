import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Text } from '../ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Calendar, User, MessageCircle } from 'lucide-react-native';
import { colors } from '../../theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth-context';

interface BottomNavProps {
  activeTab: string;
  navigate: (screen: string, data?: any) => void;
  userRole?: string;
  isAuthenticated?: boolean;
}

const tabs = [
  { id: 'home', Icon: Home, label: 'Home' },
  { id: 'search', Icon: Search, label: 'Discover' },
  { id: 'chat', Icon: MessageCircle, label: 'Chat' },
  { id: 'events', Icon: Calendar, label: 'Events' },
  { id: 'profile', Icon: User, label: 'Profile' },
];

const ACTIVE = '#22D3EE';
const INACTIVE = 'rgba(255,255,255,0.58)';

export default function BottomNav({ activeTab, navigate, userRole, isAuthenticated }: BottomNavProps) {
  const insets = useSafeAreaInsets();
  const { appUser, session, user } = useAuth();
  const hasSession = !!(user ?? session?.user);
  const effectiveIsAuthenticated = Boolean(isAuthenticated || hasSession || appUser);
  const effectiveUserRole = userRole ?? appUser?.role ?? 'public';
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (!effectiveIsAuthenticated || !appUser?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', appUser.id)
        .eq('is_read', false);
      
      setUnreadCount(count || 0);
    };

    fetchUnreadCount();

    // Listen for new messages to update badge
    const channel = supabase
      .channel('unread-counts')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${appUser.id}`
      }, () => {
        fetchUnreadCount();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [effectiveIsAuthenticated, appUser?.id]);

  const handleTabPress = (tabId: string) => {
    if (tabId === 'home') {
      navigate('public-home');
      return;
    }
    if (tabId === 'search') {
      navigate('search-discover');
      return;
    }
    if (tabId === 'chat') {
      if (effectiveIsAuthenticated) {
        navigate('chat-hub');
      } else {
        navigate('login-signup', { returnTo: 'chat-hub' });
      }
      return;
    }
    if (tabId === 'events') {
      navigate('events-grid');
      return;
    }
    if (tabId === 'profile') {
      if (effectiveIsAuthenticated && effectiveUserRole === 'admin') {
        navigate('admin-dashboard');
      } else if (effectiveIsAuthenticated) {
        navigate('artist-profile', { selectedArtist: { id: 'me' } });
      } else {
        navigate('login-signup', { returnTo: 'public-home' });
      }
      return;
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.content}>
        {tabs.map((tab) => {
          const Icon = tab.Icon;
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              style={[styles.tab, isActive && styles.tabActive]}
            >
              <View>
                <Icon
                  size={20}
                  color={isActive ? ACTIVE : INACTIVE}
                  strokeWidth={2}
                />
                {tab.id === 'chat' && unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  { color: isActive ? ACTIVE : INACTIVE },
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
    paddingHorizontal: 14,
    backgroundColor: 'transparent',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(8,12,24,0.92)',
    borderRadius: 26,
  },
  tab: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 62,
  },
  tabActive: {
    backgroundColor: 'rgba(34,211,238,0.14)',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
  labelActive: {
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: '#F43F5E',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#080C18',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
  },
});
