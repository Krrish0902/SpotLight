import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '../components/ui/Button';
import { Tabs } from '../components/ui/Tabs';
import { Card } from '../components/ui/Card';
import { MessageCircle, Check, X, Clock } from 'lucide-react-native';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { parseSupabaseDate, formatRelativeTime } from '../lib/timeUtils';
interface Props {
  navigate: (screen: string, data?: any) => void;
}

export default function ChatHub({ navigate }: Props) {
  const { appUser, user, session } = useAuth();
  const currentUserId = appUser?.id ?? user?.id ?? session?.user?.id ?? null;
  const [activeTab, setActiveTab] = useState('active');
  const [requests, setRequests] = useState<any[]>([]);
  const [activeChats, setActiveChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) {
      setRequests([]);
      setActiveChats([]);
      setLoading(false);
      return;
    }

    fetchData();
    
    const channel = supabase
      .channel('public:message_requests')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_requests',
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_requests',
        filter: `sender_id=eq.${currentUserId}`,
      }, () => {
        fetchData();
      })
      // Re-fetch unread counts when any message is inserted or marked as read
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        fetchData();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${currentUserId}`,
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  const fetchData = async () => {
    if (!currentUserId) return;
    setLoading(true);

    try {
      // Fetch Pending Requests (where the user is the receiver)
      const { data: pendingData, error: pendingError } = await supabase
        .from('message_requests')
        .select(`
          id, 
          status, 
          created_at,
          sender_id
        `)
        .eq('receiver_id', currentUserId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (pendingError) {
        console.error('Failed to fetch pending message requests:', pendingError);
      }

      // Fetch Active Chats (where user is either sender or receiver and status is accepted)
      const { data: activeData, error: activeError } = await supabase
        .from('message_requests')
        .select(`
          id, 
          status, 
          created_at,
          updated_at,
          sender_id,
          receiver_id
        `)
        .eq('status', 'accepted')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('updated_at', { ascending: false });

      if (activeError) {
        console.error('Failed to fetch active chats:', activeError);
      }

      const safePendingData = pendingData || [];
      const safeActiveData = activeData || [];

      // Collect all unique user IDs we need for rendering
      const userIds = new Set<string>();
      safePendingData.forEach((req: any) => userIds.add(req.sender_id));
      safeActiveData.forEach((chat: any) => {
        if (chat.sender_id !== currentUserId) userIds.add(chat.sender_id);
        if (chat.receiver_id !== currentUserId) userIds.add(chat.receiver_id);
      });

      let profilesMap: Record<string, any> = {};
      if (userIds.size > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, username, avatar_url')
          .in('user_id', Array.from(userIds));

        if (profilesError) {
          console.error('Failed to fetch chat participant profiles:', profilesError);
        }

        profilesMap = (profiles || []).reduce((acc: any, p: any) => {
          acc[p.user_id] = p;
          return acc;
        }, {});
      }

      setRequests(
        safePendingData.map((req: any) => ({
          ...req,
          sender: profilesMap[req.sender_id],
        }))
      );

      // Fetch unreads across all active chats
      const { data: unreadData } = await supabase
        .from('messages')
        .select('sender_id, receiver_id')
        .eq('receiver_id', currentUserId)
        .eq('is_read', false);

      const unreadCounts = (unreadData || []).reduce((acc: any, msg: any) => {
        acc[msg.sender_id] = (acc[msg.sender_id] || 0) + 1;
        return acc;
      }, {});

      // Fetch the absolute latest message for each chat
      const { data: latestMessages } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, sent_at')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('sent_at', { ascending: false })
        .limit(200);

      // Map latest messages by the *other* person's ID for easy lookup
      const latestMsgsMap = (latestMessages || []).reduce((acc: any, msg: any) => {
        const otherId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id;
        if (!acc[otherId]) acc[otherId] = msg; // only save the first one (newest)
        return acc;
      }, {});

      // Transform data to get the *other* person's profile
      const chats = safeActiveData.map((chat: any) => {
        const isSender = chat.sender_id === currentUserId;
        const otherId = isSender ? chat.receiver_id : chat.sender_id;
        const otherProfile = profilesMap[otherId];

        const latestMsg = latestMsgsMap[otherId];
        let timeDisplay = '';
        let previewText = 'Say hi!';

        if (latestMsg) {
          previewText = latestMsg.sender_id === currentUserId ? `You: ${latestMsg.content}` : latestMsg.content;
          timeDisplay = formatRelativeTime(latestMsg.sent_at);
        }

        return {
          ...chat,
          otherProfile,
          preview: previewText,
          timeDisplay,
          unreadCount: unreadCounts[otherId] || 0,
          sortTime: latestMsg ? parseSupabaseDate(latestMsg.sent_at).getTime() : parseSupabaseDate(chat.updated_at).getTime()
        };
      });

      chats.sort((a, b) => b.sortTime - a.sortTime); // Sort by most recent message
      setActiveChats(chats);
    } catch (err) {
      console.error('Error fetching chat data:', err);
      // Ensure stale data is cleared after hard failure to avoid confusing UI
      setRequests([]);
      setActiveChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('message_requests')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', requestId);

      if (error) throw error;

      // Optimistic update
      setRequests(current => current.filter(req => req.id !== requestId));
      
      if (newStatus === 'accepted') {
         // Refresh data to populate active chats properly
         fetchData();
         Alert.alert('Success', 'Message request accepted!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update request');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>

      <View style={styles.content}>
        <Tabs 
          defaultValue="active" 
          fullWidth 
          tabs={[
            { value: 'active', label: 'Active Chats' }, 
            { value: 'requests', label: `Requests (${requests.length})` }
          ]}
        >
          {(tab) => tab === 'requests' ? (
             <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {loading ? (
                  <ActivityIndicator color="#22D3EE" style={{ marginTop: 40 }} />
                ) : requests.length > 0 ? (
                  requests.map((req) => (
                    <Card key={req.id} style={styles.requestCard}>
                      <View style={styles.requestRow}>
                        <Image 
                          source={{ uri: req.sender?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }} 
                          style={styles.avatar} 
                        />
                        <View style={styles.requestInfo}>
                          <Text style={styles.name}>{req.sender?.display_name || req.sender?.username || 'Unknown User'}</Text>
                          <Text style={styles.subtitle}>wants to connect</Text>
                          <View style={styles.timeRow}>
                            <Clock size={12} color="rgba(255,255,255,0.4)" />
                            <Text style={styles.time}>
                              {parseSupabaseDate(req.created_at).toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                      
                      <View style={styles.actionRow}>
                        <Button 
                          variant="outline" 
                          style={styles.actionBtn}
                          onPress={() => handleRequestAction(req.id, 'rejected')}
                        >
                          <X size={16} color="#fff" />
                          <Text style={styles.btnText}>Decline</Text>
                        </Button>
                        <Button 
                          style={[styles.actionBtn, styles.acceptBtn]}
                          onPress={() => handleRequestAction(req.id, 'accepted')}
                        >
                          <Check size={16} color="#fff" />
                          <Text style={styles.btnTextPrimary}>Accept</Text>
                        </Button>
                      </View>
                    </Card>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MessageCircle size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No pending requests</Text>
                    <Text style={styles.emptyText}>When artists or organizers want to message you, their requests will appear here.</Text>
                  </View>
                )}
             </ScrollView>
          ) : (
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {loading ? (
                  <ActivityIndicator color="#22D3EE" style={{ marginTop: 40 }} />
                ) : activeChats.length > 0 ? (
                  activeChats.map((chat) => (
                    <Pressable 
                      key={chat.id} 
                      style={styles.chatRow}
                      onPress={() => navigate('messaging', { 
                        selectedArtist: { 
                          id: chat.otherProfile?.user_id, 
                          name: chat.otherProfile?.display_name,
                          avatar_url: chat.otherProfile?.avatar_url
                        },
                        chatId: chat.id
                      })}
                    >
                      <Image 
                        source={{ uri: chat.otherProfile?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' }} 
                        style={styles.chatAvatar} 
                      />
                      <View style={styles.chatInfo}>
                        <View style={styles.chatHeader}>
                          <Text style={styles.chatName} numberOfLines={1}>
                            {chat.otherProfile?.display_name || chat.otherProfile?.username || 'Unknown User'}
                          </Text>
                          {chat.timeDisplay ? (
                            <Text style={styles.chatTime}>{chat.timeDisplay}</Text>
                          ) : null}
                        </View>
                        <View style={styles.chatPreviewRow}>
                          <Text style={[styles.chatPreview, chat.unreadCount > 0 && styles.chatPreviewUnread]} numberOfLines={1}>
                            {chat.preview}
                          </Text>
                          {chat.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </Pressable>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <MessageCircle size={48} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.emptyTitle}>No active chats</Text>
                    <Text style={styles.emptyText}>Send a message request from an artist's profile or video feed to start chatting.</Text>
                  </View>
                )}
            </ScrollView>
          )}
        </Tabs>
      </View>

      <BottomNav activeTab="chat" navigate={navigate} userRole={appUser?.role} isAuthenticated={!!appUser?.id} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 72,
    paddingHorizontal: 22,
    paddingBottom: 18,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 14,
  },
  listContainer: {
    marginTop: 18,
    marginBottom: 80, // Space for BottomNav
  },
  requestCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    marginHorizontal: 10,
    marginBottom: 16,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  requestInfo: {
    flex: 1,
  },
  name: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  time: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 100,
  },
  acceptBtn: { backgroundColor: '#FDF2FF' },
  btnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  btnTextPrimary: {
    color: '#162447',
    fontSize: 15,
    fontWeight: '800',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginHorizontal: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 22,
    gap: 16,
  },
  chatAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)'
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.5,
    flex: 1,
    marginRight: 8,
  },
  chatTime: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '500',
  },
  chatPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatPreview: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  chatPreviewUnread: {
    color: '#ffffff',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#22D3EE',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#08313C',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
