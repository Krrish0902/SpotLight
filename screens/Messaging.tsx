import React, { useState, useEffect, useRef } from 'react';
import { View, Image, ScrollView, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, MoreVertical } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Message {
  message_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  sent_at: string;
  is_read: boolean;
}

interface Props { 
  navigate: (screen: string, data?: any) => void; 
  artist?: any;
  chatId?: string;
}

export default function Messaging({ navigate, artist, chatId }: Props) {
  const { appUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (appUser?.id && artist?.id) {
      fetchMessages();
      
      // Subscribe to real-time changes
      const channel = supabase
        .channel(`messages:${chatId || artist.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${appUser.id}`,
        }, (payload) => {
          // Only add if it's from the current chat partner
          if (payload.new.sender_id === artist.id) {
             setMessages(prev => [...prev, payload.new as Message]);
             // Automatically mark as read if we are looking at the screen
             supabase.from('messages').update({ is_read: true }).eq('message_id', payload.new.message_id).then();
             setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${appUser.id}`,
        }, (payload) => {
          // Update in-memory message if the receiver read it
          if (payload.new.receiver_id === artist.id && payload.new.is_read) {
            setMessages(prev => prev.map(m => m.message_id === payload.new.message_id ? { ...m, is_read: true } : m));
          }
        })
        // Presence for typing indicators
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const remoteTyping = Object.values(state).some(
             (presenceGroup: any) => presenceGroup.some((p: any) => p.user_id === artist.id && p.typing)
          );
          setIsTyping(remoteTyping);
        });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: appUser.id, typing: false });
        }
      });

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [appUser?.id, artist?.id, chatId]);

  const fetchMessages = async () => {
    if (!appUser || !artist) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${appUser.id},receiver_id.eq.${artist.id}),and(sender_id.eq.${artist.id},receiver_id.eq.${appUser.id})`)
        .order('sent_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 200);
        
        // Mark all unread messages from this sender as read
        const unreadIds = data.filter(m => !m.is_read && m.sender_id === artist.id).map(m => m.message_id);
        if (unreadIds.length > 0) {
          supabase.from('messages').update({ is_read: true }).in('message_id', unreadIds).then();
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    if (!appUser || !artist) return;

    const channel = supabase.channel(`messages:${chatId || artist.id}`);
    channel.track({ user_id: appUser.id, typing: text.length > 0 });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Auto-clear typing status after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ user_id: appUser.id, typing: false });
    }, 3000);
  };

  const handleSend = async () => {
    if (!message.trim() || !appUser || !artist) return;
    
    const content = message.trim();
    setMessage(''); // Optimistic clear
    
    const channel = supabase.channel(`messages:${chatId || artist.id}`);
    channel.track({ user_id: appUser.id, typing: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    // Create optimistic message using random UUID to avoid key collisions
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const tempMessage: Message = {
      message_id: optimisticId,
      sender_id: appUser.id,
      receiver_id: artist.id,
      content,
      sent_at: new Date().toISOString(),
      is_read: false
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: appUser.id,
          receiver_id: artist.id,
          content
        });

      if (error) {
        console.error('Failed to send message:', error);
        // Remove optimistic message if failed
        setMessages(prev => prev.filter(m => m.message_id !== tempMessage.message_id));
        setMessage(content); // Restore input
      } else {
        // Update updated_at on the underlying chat request so it bubbles to top of ChatHub
        if (chatId) {
           await supabase
             .from('message_requests')
             .update({ updated_at: new Date().toISOString() })
             .eq('id', chatId);
        }
      }
    } catch (err) {
      console.error('Send error:', err);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#030712', '#000']} style={StyleSheet.absoluteFill} />
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('chat-hub')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <View style={styles.headerInfo}>
          <Image source={{ uri: artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.headerAvatar} />
          <View>
            <Text style={styles.headerName}>{artist?.name || artist?.display_name || 'Loading...'}</Text>
            <Text style={styles.headerStatus}>Active chat</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        contentContainerStyle={styles.messages} 
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator color="#a855f7" style={{ marginTop: 20 }} />
        ) : messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Say hi to {artist?.name || 'them'}!</Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.sender_id === appUser?.id;
            const time = new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            // Determine if this is the absolute last message we sent that has been read
            const isLastReadMessage = isMe && msg.is_read && 
              messages.slice(index + 1).filter(m => m.sender_id === appUser?.id && m.is_read).length === 0;

            return (
              <View key={msg.message_id}>
                <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                  <Card style={[styles.msgBubble, isMe && styles.msgBubbleMe]}>
                    <Text style={styles.msgText}>{msg.content}</Text>
                  </Card>
                  <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>{time}</Text>
                </View>
                {isLastReadMessage && (
                  <View style={styles.seenRow}>
                    <Text style={styles.seenText}>Seen</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
        
        {isTyping && (
          <View style={styles.typingRow}>
            <Image source={{ uri: artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop' }} style={styles.typingAvatar} />
            <View style={styles.typingBubble}>
               <Text style={styles.typingText}>Typing...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputRow}>
        <Input 
          value={message} 
          onChangeText={handleTyping} 
          placeholder="Type a message..." 
          style={styles.input} 
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        <Button size="icon" style={styles.sendBtn} onPress={handleSend} disabled={!message.trim()}>
          <Send size={20} color="#fff" />
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20 },
  headerName: { color: '#fff', fontWeight: '600' },
  headerStatus: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  messages: { padding: 16, flexGrow: 1 },
  msgRow: { alignItems: 'flex-start', marginBottom: 8 },
  msgRowMe: { alignItems: 'flex-end' },
  msgBubble: { maxWidth: '75%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 12 },
  msgBubbleMe: { backgroundColor: '#a855f7' },
  msgText: { color: '#fff', fontSize: 14 },
  msgTime: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 },
  msgTimeMe: { textAlign: 'right' },
  seenRow: { alignItems: 'flex-end', marginBottom: 8 },
  seenText: { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '500' },
  typingRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 16 },
  typingAvatar: { width: 24, height: 24, borderRadius: 12, opacity: 0.8 },
  typingBubble: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 16, borderBottomLeftRadius: 4 },
  typingText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', gap: 8, padding: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  input: { flex: 1 },
  sendBtn: { backgroundColor: '#a855f7' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
});
