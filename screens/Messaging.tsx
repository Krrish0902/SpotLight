/**
 * Messaging.tsx — WhatsApp-inspired chat UI for SpotLight
 * Dark theme, purple accents, fixed header + footer, only messages scroll.
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
import { ChevronLeft, Video, Phone, MoreVertical, Send, Check, CheckCheck } from 'lucide-react-native';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';
import { formatMessageTime, parseSupabaseDate } from '../lib/timeUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../components/ui/Text';

// ─── Colours ──────────────────────────────────────────────────────────────────
const C = {
  // Dark backgrounds
  bg:            '#0b0f1c',
  wallpaper:     '#0d1220',
  headerBg:      '#111827',
  inputBg:       '#111827',
  // Message bubbles
  sentBubble:    '#1e3a5f',       // dark blue-tinted (WhatsApp green equivalent in dark)
  sentBg1:       '#7c3aed',
  sentBg2:       '#5b21b6',
  receivedBubble:'#1c2333',
  // Text
  textPrimary:   '#f0f0f5',
  textSecondary: '#8b93a7',
  // Accents
  purple:        '#9333ea',
  purpleLight:   '#c084fc',
  teal:          '#34d399',
  tick:          '#60a5fa',       // blue ticks for read (like WA blue ticks)
  // Borders
  border:        'rgba(255,255,255,0.06)',
  dateBg:        'rgba(255,255,255,0.08)',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDateLabel(dateString: string): string {
  try {
    const date = parseSupabaseDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const fmt = (d: Date) => d.toDateString();
    if (fmt(date) === fmt(today)) return 'Today';
    if (fmt(date) === fmt(yesterday)) return 'Yesterday';
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  } catch { return ''; }
}

// Check if two messages are on different calendar days
function isDifferentDay(a: string, b: string): boolean {
  try {
    const da = parseSupabaseDate(a);
    const db = parseSupabaseDate(b);
    return da.toDateString() !== db.toDateString();
  } catch { return false; }
}

// ─── Typing dots ──────────────────────────────────────────────────────────────
function TypingDots() {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const anims = dots.map((d, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 150),
        Animated.timing(d, { toValue: -5, duration: 280, useNativeDriver: true }),
        Animated.timing(d, { toValue: 0, duration: 280, useNativeDriver: true }),
        Animated.delay(500),
      ]))
    );
    anims.forEach(a => a.start());
    return () => anims.forEach(a => a.stop());
  }, []);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingHorizontal: 4, height: 16 }}>
      {dots.map((d, i) => (
        <Animated.View key={i} style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: C.textSecondary, transform: [{ translateY: d }] }} />
      ))}
    </View>
  );
}

// ─── Online pulse ─────────────────────────────────────────────────────────────
function OnlineDot() {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(scale, { toValue: 1.6, duration: 850, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 850, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <View style={st.onlineOuter}>
      <Animated.View style={[st.onlineRing, { transform: [{ scale }] }]} />
      <View style={st.onlineCore} />
    </View>
  );
}

// ─── Message types ────────────────────────────────────────────────────────────
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

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function Messaging({ navigate, artist, chatId }: Props) {
  const { appUser } = useAuth();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const channelRef = useRef<any>(null);

  const avatarUri = artist?.avatar_url || artist?.profile_image_url ||
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop';

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appUser?.id || !artist?.id) return;
    fetchMessages();

    const ch = supabase
      .channel(`dm:${chatId ?? [appUser.id, artist.id].sort().join('_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${appUser.id}` }, payload => {
        if (payload.new.sender_id !== artist.id) return;
        setMessages(p => [...p, payload.new as Message]);
        supabase.from('messages').update({ is_read: true }).eq('message_id', payload.new.message_id).then();
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `sender_id=eq.${appUser.id}` }, payload => {
        if (payload.new.receiver_id === artist.id && payload.new.is_read) {
          setMessages(p => p.map(m => m.message_id === payload.new.message_id ? { ...m, is_read: true } : m));
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<any>();
        const all: any[] = Object.values(state).flat();
        const them = all.find((p: any) => p.user_id === artist.id);
        setIsOnline(!!them);
        setIsTyping(!!(them?.typing));
      })
      .on('presence', { event: 'join' }, ({ newPresences }: any) => {
        if (newPresences.find((p: any) => p.user_id === artist.id)) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        if (leftPresences.find((p: any) => p.user_id === artist.id)) { setIsOnline(false); setIsTyping(false); }
      });

    ch.subscribe(async (status: string) => {
      if (status === 'SUBSCRIBED') await ch.track({ user_id: appUser.id, typing: false });
    });
    channelRef.current = ch;
    return () => { supabase.removeChannel(ch); };
  }, [appUser?.id, artist?.id, chatId]);

  const fetchMessages = async () => {
    if (!appUser || !artist) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages').select('*')
        .or(`and(sender_id.eq.${appUser.id},receiver_id.eq.${artist.id}),and(sender_id.eq.${artist.id},receiver_id.eq.${appUser.id})`)
        .order('sent_at', { ascending: true });
      if (!error && data) {
        setMessages(data);
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: false }), 150);
        const unread = data.filter(m => !m.is_read && m.sender_id === artist.id).map(m => m.message_id);
        if (unread.length) supabase.from('messages').update({ is_read: true }).in('message_id', unread).then();
      }
    } finally { setLoading(false); }
  };

  const handleTyping = (text: string) => {
    setMessage(text);
    channelRef.current?.track({ user_id: appUser?.id, typing: text.length > 0 });
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => channelRef.current?.track({ user_id: appUser?.id, typing: false }), 3000);
  };

  const handleSend = async () => {
    const content = message.trim();
    if (!content || !appUser || !artist) return;
    setMessage('');
    channelRef.current?.track({ user_id: appUser.id, typing: false });
    if (typingTimer.current) clearTimeout(typingTimer.current);

    const oid = `opt-${Date.now()}`;
    const temp: Message = { message_id: oid, sender_id: appUser.id, receiver_id: artist.id, content, sent_at: new Date().toISOString(), is_read: false };
    setMessages(p => [...p, temp]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);

    const { data, error } = await supabase.from('messages').insert({ sender_id: appUser.id, receiver_id: artist.id, content }).select().single();
    if (error) { setMessages(p => p.filter(m => m.message_id !== oid)); setMessage(content); }
    else if (data) {
      setMessages(p => p.map(m => m.message_id === oid ? data : m));
      if (chatId) supabase.from('message_requests').update({ updated_at: new Date().toISOString() }).eq('id', chatId).then();
    }
  };

  const lastReadId = [...messages].reverse().find(m => m.sender_id === appUser?.id && m.is_read)?.message_id;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={[st.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.headerBg} />

      {/* ═══ HEADER — fixed ═══ */}
      <View style={[st.header, { paddingTop: insets.top + 4 }]}>
        {/* Left: back + avatar + name */}
        <Pressable onPress={() => navigate('chat-hub')} style={st.backBtn} hitSlop={10}>
          <ChevronLeft size={26} color={C.purpleLight} strokeWidth={2.5} />
        </Pressable>

        <Pressable style={st.headerProfile}>
          <View style={st.headerAvatarWrap}>
            <Image source={{ uri: avatarUri }} style={st.headerAvatar} />
            {isOnline && (
              <View style={st.onlineBadge}>
                <OnlineDot />
              </View>
            )}
          </View>
          <View style={st.headerText}>
            <Text style={st.headerName} numberOfLines={1}>
              {artist?.name || artist?.display_name || '...'}
            </Text>
            <Text style={[st.headerSub, isOnline && { color: C.teal }]}>
              {isTyping ? 'typing...' : isOnline ? 'online' : 'tap for info'}
            </Text>
          </View>
        </Pressable>

        {/* Right: video + call */}
        <View style={st.headerActions}>
          <Pressable style={st.headerIconBtn} hitSlop={8}>
            <Video size={20} color={C.purpleLight} strokeWidth={2} />
          </Pressable>
          <Pressable style={st.headerIconBtn} hitSlop={8}>
            <Phone size={18} color={C.purpleLight} strokeWidth={2} />
          </Pressable>
          <Pressable style={st.headerIconBtn} hitSlop={8}>
            <MoreVertical size={20} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* ═══ MESSAGES — scrollable only ═══ */}
      <ScrollView
        ref={scrollRef}
        style={[st.messages, { backgroundColor: C.wallpaper }]}
        contentContainerStyle={st.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={st.loadingWrap}>
            <ActivityIndicator color={C.purple} size="large" />
          </View>
        ) : messages.length === 0 ? (
          <View style={st.emptyWrap}>
            <Image source={{ uri: avatarUri }} style={st.emptyAvatar} />
            <Text style={st.emptyTitle}>{artist?.name || artist?.display_name}</Text>
            <View style={st.emptyHintPill}>
              <Text style={st.emptyHintText}>Messages are end-to-end encrypted 🔒</Text>
            </View>
          </View>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const isMe = msg.sender_id === appUser?.id;
              const time = formatMessageTime(msg.sent_at);
              const isRead = msg.is_read;
              const isLastRead = msg.message_id === lastReadId;

              // Date separator
              const prevMsg = messages[idx - 1];
              const showDateSep = idx === 0 || (prevMsg && isDifferentDay(prevMsg.sent_at, msg.sent_at));

              // Avatar grouping — show avatar only on last of a recv group
              const nextMsg = messages[idx + 1];
              const isLastInRecvGroup = !isMe && (
                !nextMsg || nextMsg.sender_id !== msg.sender_id || (nextMsg && isDifferentDay(msg.sent_at, nextMsg.sent_at))
              );

              return (
                <View key={msg.message_id}>
                  {/* Date separator */}
                  {showDateSep && (
                    <View style={st.dateSepRow}>
                      <View style={st.dateSepPill}>
                        <Text style={st.dateSepText}>{formatDateLabel(msg.sent_at)}</Text>
                      </View>
                    </View>
                  )}

                  {/* Message row */}
                  <View style={[st.row, isMe ? st.rowMe : st.rowThem]}>
                    {/* Received: avatar placeholder */}
                    {!isMe && (
                      <View style={st.avatarCol}>
                        {isLastInRecvGroup ? (
                          <Image source={{ uri: avatarUri }} style={st.msgAvatar} />
                        ) : (
                          <View style={st.msgAvatarSpacer} />
                        )}
                      </View>
                    )}

                    {/* Bubble */}
                    {isMe ? (
                      <LinearGradient
                        colors={[C.sentBg1, C.sentBg2]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={[st.bubble, st.bubbleMe]}
                      >
                        <Text style={st.bubbleTextMe}>{msg.content}</Text>
                        {/* Timestamp + tick inline */}
                        <View style={st.metaRow}>
                          <Text style={st.metaTime}>{time}</Text>
                          {isMe && (
                            isRead
                              ? <CheckCheck size={13} color={C.tick} strokeWidth={2.5} style={st.tick} />
                              : <Check size={13} color="rgba(255,255,255,0.4)" strokeWidth={2.5} style={st.tick} />
                          )}
                        </View>
                      </LinearGradient>
                    ) : (
                      <View style={[st.bubble, st.bubbleThem]}>
                        <Text style={st.bubbleTextThem}>{msg.content}</Text>
                        <View style={st.metaRow}>
                          <Text style={st.metaTime}>{time}</Text>
                        </View>
                      </View>
                    )}
                  </View>

                  {/* Seen label under last read sent */}
                  {isLastRead && (
                    <View style={st.seenRow}>
                      <Image source={{ uri: avatarUri }} style={st.seenAvatar} />
                      <Text style={st.seenText}>Seen</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Typing indicator */}
            {isTyping && (
              <View style={[st.row, st.rowThem]}>
                <View style={st.avatarCol}>
                  <Image source={{ uri: avatarUri }} style={st.msgAvatar} />
                </View>
                <View style={[st.bubble, st.bubbleThem, { paddingHorizontal: 14, paddingVertical: 10 }]}>
                  <TypingDots />
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* ═══ INPUT BAR — fixed ═══ */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={[st.inputBar, { backgroundColor: C.inputBg, paddingBottom: insets.bottom + 8 }]}>
          {/* Text input */}
          <View style={st.inputPill}>
            <TextInput
              value={message}
              onChangeText={handleTyping}
              placeholder="Message"
              placeholderTextColor={C.textSecondary}
              style={st.textInput}
              multiline
              textAlignVertical="center"
            />
          </View>

          {/* Send / mic button */}
          <Pressable
            onPress={handleSend}
            disabled={!message.trim()}
            style={({ pressed }) => [st.sendBtn, pressed && { opacity: 0.75 }]}
          >
            <LinearGradient
              colors={message.trim() ? [C.sentBg1, C.sentBg2] : ['#1c2333', '#1c2333']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={st.sendBtnInner}
            >
              <Send size={18} color={message.trim() ? '#fff' : C.textSecondary} strokeWidth={2.2} />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const MSG_AVATAR = 28;

const st = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingBottom: 10,
    backgroundColor: '#111827',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 2,
  },
  backBtn: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerProfile: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 2 },
  headerAvatarWrap: { position: 'relative' },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(147,51,234,0.4)' },
  onlineBadge: { position: 'absolute', bottom: -1, right: -1, backgroundColor: '#111827', borderRadius: 8, padding: 1 },
  onlineOuter: { width: 11, height: 11, alignItems: 'center', justifyContent: 'center' },
  onlineRing: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: 'rgba(52,211,153,0.3)' },
  onlineCore: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#34d399' },
  headerText: { flex: 1 },
  headerName: { color: '#f0f0f5', fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  headerSub: { color: '#8b93a7', fontSize: 12, fontWeight: '500', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  headerIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },

  // Messages area
  messages: { flex: 1 },
  messagesContent: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 12, flexGrow: 1 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },

  // Empty state
  emptyWrap: { flex: 1, alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyAvatar: { width: 72, height: 72, borderRadius: 36, borderWidth: 2, borderColor: 'rgba(147,51,234,0.4)' },
  emptyTitle: { color: '#f0f0f5', fontSize: 16, fontWeight: '700' },
  emptyHintPill: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  emptyHintText: { color: '#8b93a7', fontSize: 12, fontWeight: '500' },

  // Date separator
  dateSepRow: { alignItems: 'center', marginVertical: 10 },
  dateSepPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
  },
  dateSepText: { color: '#8b93a7', fontSize: 12, fontWeight: '600' },

  // Message rows
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 2, gap: 6 },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },

  // Avatars
  avatarCol: { width: MSG_AVATAR, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 },
  msgAvatar: { width: MSG_AVATAR, height: MSG_AVATAR, borderRadius: MSG_AVATAR / 2 },
  msgAvatarSpacer: { width: MSG_AVATAR },

  // Bubbles
  bubble: {
    maxWidth: '74%',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingTop: 8,
    paddingBottom: 6,
  },
  bubbleMe: {
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#1c2333',
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  bubbleTextMe: { color: '#fff', fontSize: 15, fontWeight: '400', lineHeight: 21 },
  bubbleTextThem: { color: '#e8eaf0', fontSize: 15, fontWeight: '400', lineHeight: 21 },

  // Meta row (time + tick)
  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end',
    gap: 3, marginTop: 3,
  },
  metaTime: { color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: '500' },
  tick: { marginLeft: 1 },

  // Seen
  seenRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginRight: 6, marginBottom: 6 },
  seenAvatar: { width: 14, height: 14, borderRadius: 7, opacity: 0.7 },
  seenText: { color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: '600' },  

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.07)',
  },
  inputPill: {
    flex: 1,
    backgroundColor: '#1c2333',
    borderRadius: 24,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 7,
    minHeight: 46,
    maxHeight: 130,
    justifyContent: 'center',
  },
  textInput: {
    color: '#f0f0f5',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 20,
    padding: 0, margin: 0,
  },
  sendBtn: { marginBottom: 0 },
  sendBtnInner: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
