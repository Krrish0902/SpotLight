/**
 * Messaging.tsx — "Sonic Midnight" Premium Chat UI
 * Deep indigo backgrounds, glassmorphism, vibrant gradients, and breathable editorial layout.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Pressable,
  TextInput,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, MoreVertical, Video, Phone } from 'lucide-react-native';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatMessageTime } from '../lib/timeUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';

// ─── Design Tokens ──────────────────────────────────────────────────────────
const C = {
  bg:              '#020617', // Deepest Indigo-Black
  surface:         '#0f172a', // Slate 900
  glass:           'rgba(255, 255, 255, 0.05)',
  glassBorder:     'rgba(255, 255, 255, 0.12)',
  primary:         '#22d3ee', // Cyan/Teal (from BottomNav)
  secondary:       '#0891b2', // Darker Teal
  onSurface:       '#f1f5f9',
  onSurfaceMuted:  '#94a3b8',
  online:          '#22d3ee', // Match teal
};

// ─── Breathing Presence Ring ────────────────────────────────────────────────
function BreathingPresence() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.5, duration: 2000, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 2000, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        st.presenceRing,
        { transform: [{ scale }], opacity, borderColor: C.online }
      ]}
    />
  );
}

// ─── Typing Pulse ───────────────────────────────────────────────────────────
function TypingPulse() {
  const opacity = useRef(new Animated.Value(0.3)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={st.typingRow}>
      <Animated.View style={[st.typingLine, { opacity }]} />
      <Text style={st.typingLabel}>typing</Text>
    </View>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function Messaging({ navigate, artist, chatId }: { navigate: any, artist: any, chatId?: string }) {
  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const scrollRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const typingRef = useRef<any>(null);

  const avatarUri = artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f';

  useEffect(() => {
    if (!appUser?.id || !artist?.id) return;
    fetchMessages();

    const ch = supabase
      .channel(`dm:${chatId ?? [appUser.id, artist.id].sort().join('_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${appUser.id}` }, p => {
        if (p.new.sender_id !== artist.id) return;
        setMessages(prev => [...prev, p.new]);
        supabase.from('messages').update({ is_read: true }).eq('message_id', p.new.message_id).then();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<any>();
        const users = Object.values(state).flat();
        const them = users.find(u => u.user_id === artist.id);
        setIsOnline(!!them);
        setIsTyping(!!them?.typing);
      })
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') await ch.track({ user_id: appUser.id, typing: false });
      });

    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [appUser?.id, artist?.id, chatId]);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*')
      .or(`and(sender_id.eq.${appUser?.id},receiver_id.eq.${artist?.id}),and(sender_id.eq.${artist?.id},receiver_id.eq.${appUser?.id})`)
      .order('sent_at', { ascending: true });
    if (data) {
      setMessages(data);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 200);
    }
    setLoading(false);
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    channelRef.current?.track({ user_id: appUser?.id, typing: text.length > 0 });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => channelRef.current?.track({ user_id: appUser?.id, typing: false }), 3000);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const content = message.trim();
    setMessage('');
    channelRef.current?.track({ user_id: appUser?.id, typing: false });

    const temp = { message_id: `temp-${Date.now()}`, sender_id: appUser?.id, receiver_id: artist?.id, content, sent_at: new Date().toISOString() };
    setMessages(p => [...p, temp]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    await supabase.from('messages').insert({ sender_id: appUser?.id, receiver_id: artist?.id, content });
  };

  return (
    <View style={[st.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />
      
      {/* ═══ HEADER ═══ */}
      <View style={[st.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Pressable onPress={() => navigate('chat-hub')} hitSlop={12}>
          <ChevronLeft size={28} color={C.onSurface} strokeWidth={2.5} />
        </Pressable>

        <View style={st.headerCenter}>
          <View style={st.headerAvatarArea}>
            {isOnline && <BreathingPresence />}
            <Image source={{ uri: avatarUri }} style={st.headerAvatar} />
          </View>
          <View style={st.headerText}>
            <Text style={st.headerName}>{artist?.name || artist?.display_name || 'Artist'}</Text>
            {isTyping ? <TypingPulse /> : <Text style={st.headerStatus}>{isOnline ? 'Online now' : 'Tap for details'}</Text>}
          </View>
        </View>

        <View style={st.headerRight}>
          <Pressable style={st.hIcon}><Video size={22} color={C.onSurface} /></Pressable>
          <Pressable style={st.hIcon}><MoreVertical size={22} color={C.onSurface} /></Pressable>
        </View>
      </View>

      {/* ═══ MESSAGES ═══ */}
      <ScrollView
        ref={scrollRef}
        style={st.scroll}
        contentContainerStyle={st.contentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={st.loading}><ActivityIndicator color={C.primary} /></View>
        ) : messages.map((msg, idx) => {
          const isMe = msg.sender_id === appUser?.id;
          return (
            <View key={msg.message_id} style={[st.msgRow, isMe ? st.msgMe : st.msgThem]}>
              {!isMe && <Image source={{ uri: avatarUri }} style={st.itemAvatar} />}
              {isMe ? (
                <LinearGradient
                  colors={[C.primary, C.secondary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={st.bubbleMe}
                >
                  <Text style={st.textMe}>{msg.content}</Text>
                </LinearGradient>
              ) : (
                <View style={st.bubbleThem}>
                  {/* Subtle rim light via border */}
                  <View style={st.rimLight} />
                  <Text style={st.textThem}>{msg.content}</Text>
                </View>
              )}
              {/* Ethereal Time */}
              <Text style={[st.time, isMe ? st.timeMe : st.timeThem]}>
                {formatMessageTime(msg.sent_at)}
              </Text>
            </View>
          );
        })}
        {isTyping && (
           <View style={[st.msgRow, st.msgThem]}>
             <Image source={{ uri: avatarUri }} style={st.itemAvatar} />
             <View style={[st.bubbleThem, st.typingBubble]}>
               <TypingPulse />
             </View>
           </View>
        )}
      </ScrollView>

      {/* ═══ INPUT ═══ */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={8}>
        <View style={[st.inputArea, { paddingBottom: insets.bottom + 12 }]}>
          <View style={st.inputPill}>
            <TextInput
              style={st.textInput}
              value={message}
              onChangeText={handleTyping}
              placeholder="Sonic vibrations..."
              placeholderTextColor={C.onSurfaceMuted}
              multiline
            />
            <Pressable 
              onPress={handleSend} 
              disabled={!message.trim()}
              style={({ pressed }) => [st.sendBtn, pressed && { opacity: 0.7 }]}
            >
              <Send size={20} color={message.trim() ? C.primary : C.onSurfaceMuted} strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: C.glassBorder,
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    zIndex: 10,
  },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: 12 },
  headerAvatarArea: { position: 'relative', width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: C.glassBorder },
  presenceRing: { position: 'absolute', width: 42, height: 42, borderRadius: 21, borderWidth: 2 },
  headerText: { marginLeft: 12 },
  headerName: { color: C.onSurface, fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  headerStatus: { color: C.onSurfaceMuted, fontSize: 13, fontWeight: '500' },
  headerRight: { flexDirection: 'row', gap: 16 },
  hIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  scroll: { flex: 1 },
  contentContainer: { padding: 16, flexGrow: 1, paddingBottom: 100 },
  loading: { flex: 1, justifyContent: 'center', paddingVertical: 40 },

  msgRow: { marginBottom: 24, position: 'relative' },
  msgMe: { alignItems: 'flex-end', marginLeft: 60 },
  msgThem: { alignItems: 'flex-start', marginRight: 60, paddingLeft: 46 },
  itemAvatar: { position: 'absolute', left: 0, bottom: 0, width: 32, height: 32, borderRadius: 16, borderWidth: 1, borderColor: C.glassBorder },

  bubbleMe: {
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 26,
    borderBottomRightRadius: 4,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  bubbleThem: {
    backgroundColor: C.glass,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: 26,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  rimLight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
  },
  textMe: { color: '#fff', fontSize: 15, fontWeight: '500', lineHeight: 21 },
  textThem: { color: C.onSurface, fontSize: 15, fontWeight: '400', lineHeight: 21 },

  time: { position: 'absolute', bottom: -18, fontSize: 10, fontWeight: '600', color: C.onSurfaceMuted, opacity: 0.6 },
  timeMe: { right: 4 },
  timeThem: { left: 50 },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typingLine: { width: 12, height: 2, backgroundColor: C.online, borderRadius: 1 },
  typingLabel: { fontSize: 12, fontWeight: '700', color: C.online, textTransform: 'uppercase', letterSpacing: 1 },
  typingBubble: { paddingVertical: 10, paddingHorizontal: 16 },

  inputArea: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: C.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
  },
  textInput: {
    flex: 1, color: C.onSurface, fontSize: 15, minHeight: 40,
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  sendBtn: { marginLeft: 12, padding: 4 },
});
