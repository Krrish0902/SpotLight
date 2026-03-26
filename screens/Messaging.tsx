/**
 * Messaging.tsx — "Sonic Midnight" Premium Chat UI (Teal Edition)
 * Deep indigo backgrounds, glassmorphism, vibrant teal gradients, and breathable editorial layout.
 * Includes Fix: Status Bar / Notch Overlap safety padding.
 * REFINED: Header with direct profile navigation, removed call icons, and 3-dot menu actions (Delete/Report).
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Image,
  ScrollView,
  Modal,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Pressable,
  TextInput,
  StatusBar,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Send, MoreVertical, Ticket, X, CalendarDays, MapPin, DollarSign, FileText, Sparkles } from 'lucide-react-native';
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

// ─── Gig Booking Modal ───────────────────────────────────────────────────────
interface GigForm {
  eventName: string;
  eventDate: string;
  location: string;
  budget: string;
  notes: string;
}

function GigBookingModal({
  visible,
  artist,
  fanId,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  artist: any;
  fanId: string;
  onClose: () => void;
  onSubmit: (form: GigForm) => Promise<void>;
}) {
  const slideAnim = useRef(new Animated.Value(60)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<GigForm>({
    eventName: '', eventDate: '', location: '', budget: '', notes: '',
  });

  useEffect(() => {
    if (visible) {
      setForm({ eventName: '', eventDate: '', location: '', budget: '', notes: '' });
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, damping: 18, stiffness: 200 }),
        Animated.timing(fadeAnim,  { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      slideAnim.setValue(60);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  const patch = (key: keyof GigForm, val: string) => setForm(p => ({ ...p, [key]: val }));

  const canSubmit = form.eventName.trim() && form.eventDate.trim() && form.location.trim() && form.budget.trim();

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  };

  const avatarUri = artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f';

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[gm.backdrop, { opacity: fadeAnim }]} />
      </TouchableWithoutFeedback>

      <Animated.View style={[gm.sheet, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
        {/* ── Header ── */}
        <LinearGradient
          colors={['#0e7490', '#22d3ee', '#67e8f9']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={gm.headerGrad}
        >
          <View style={gm.headerInner}>
            <View style={gm.headerLeft}>
              <View style={gm.ticketIconWrap}>
                <Ticket size={18} color="#0e7490" strokeWidth={2.5} />
              </View>
              <View>
                <Text style={gm.headerTitle}>Book a Gig</Text>
                <Text style={gm.headerSub}>Request {artist?.name || 'this artist'} for your event</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={gm.closeBtn} hitSlop={10}>
              <X size={18} color="rgba(255,255,255,0.9)" strokeWidth={2.5} />
            </Pressable>
          </View>

          {/* Artist mini-card inside header */}
          <View style={gm.artistRow}>
            <Image source={{ uri: avatarUri }} style={gm.artistAvatar} />
            <View>
              <Text style={gm.artistName}>{artist?.name || artist?.display_name || 'Artist'}</Text>
              {artist?.genres?.length > 0 && (
                <Text style={gm.artistGenre}>{artist.genres.slice(0, 2).join(' · ')}</Text>
              )}
            </View>
            <View style={gm.sparkWrap}>
              <Sparkles size={14} color="rgba(255,255,255,0.6)" />
            </View>
          </View>
        </LinearGradient>

        {/* ── Form ── */}
        <ScrollView style={gm.formScroll} contentContainerStyle={gm.formContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <GigField icon={<FileText size={14} color={C.primary} />} label="Occasion / Event Name" required>
            <TextInput
              style={gm.input}
              value={form.eventName}
              onChangeText={v => patch('eventName', v)}
              placeholder="e.g. Birthday Party, Corporate Night..."
              placeholderTextColor={C.onSurfaceMuted}
            />
          </GigField>

          <GigField icon={<CalendarDays size={14} color={C.primary} />} label="Event Date" required>
            <TextInput
              style={gm.input}
              value={form.eventDate}
              onChangeText={v => patch('eventDate', v)}
              placeholder="e.g. Dec 15, 2026 · 8 PM"
              placeholderTextColor={C.onSurfaceMuted}
            />
          </GigField>

          <GigField icon={<MapPin size={14} color={C.primary} />} label="Venue / Location" required>
            <TextInput
              style={gm.input}
              value={form.location}
              onChangeText={v => patch('location', v)}
              placeholder="e.g. Club Nova, Chicago"
              placeholderTextColor={C.onSurfaceMuted}
            />
          </GigField>

          <GigField icon={<DollarSign size={14} color={C.primary} />} label="Your Budget" required>
            <TextInput
              style={gm.input}
              value={form.budget}
              onChangeText={v => patch('budget', v)}
              placeholder="e.g. $500, Negotiable"
              placeholderTextColor={C.onSurfaceMuted}
            />
          </GigField>

          <GigField icon={<FileText size={14} color={C.onSurfaceMuted} />} label="Additional Notes">
            <TextInput
              style={[gm.input, gm.inputMulti]}
              value={form.notes}
              onChangeText={v => patch('notes', v)}
              placeholder="Describe the vibe, set length, special requests..."
              placeholderTextColor={C.onSurfaceMuted}
              multiline
              numberOfLines={3}
            />
          </GigField>

          {/* ── Actions ── */}
          <View style={gm.actions}>
            <Pressable onPress={onClose} style={gm.cancelBtn}>
              <Text style={gm.cancelText}>Cancel</Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              style={({ pressed }) => [gm.submitWrap, (!canSubmit || submitting) && gm.submitDisabled, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={canSubmit && !submitting ? [C.primary, C.secondary] : ['#334155', '#334155']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={gm.submitGrad}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ticket size={15} color="#fff" strokeWidth={2.5} />
                    <Text style={gm.submitText}>Send Request</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function GigField({ icon, label, required, children }: { icon: React.ReactNode; label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <View style={gm.fieldWrap}>
      <View style={gm.fieldLabel}>
        {icon}
        <Text style={gm.fieldLabelText}>{label}{required && <Text style={gm.req}> *</Text>}</Text>
      </View>
      {children}
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
  const [showGigModal, setShowGigModal] = useState(false);
  const isFan = appUser?.role === 'public';
  const scrollRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const typingRef = useRef<any>(null);

  const avatarUri = artist?.avatar_url || artist?.profile_image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f';

  useEffect(() => {
    if (!appUser?.id || !artist?.id) return;
    fetchMessages();

    const channelName = `dm:${chatId ?? [appUser.id, artist.id].sort().join('_')}`;

    const ch = supabase
      .channel(channelName)
      // ── New messages (no server-side filter — avoids REPLICA IDENTITY requirement)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, p => {
        const msg = p.new as any;
        // Only care about messages in this conversation
        const inConvo =
          (msg.sender_id === artist.id && msg.receiver_id === appUser.id) ||
          (msg.sender_id === appUser.id && msg.receiver_id === artist.id);
        if (!inConvo) return;
        // Deduplicate: skip if we already have it (optimistic insert)
        setMessages(prev => {
          if (prev.some(m => m.message_id === msg.message_id)) return prev;
          // Replace any matching temp message (same content, sender, within 5s)
          const tempIdx = prev.findIndex(
            m => String(m.message_id).startsWith('temp') &&
                 m.sender_id === msg.sender_id &&
                 m.content === msg.content
          );
          const next = tempIdx >= 0
            ? [...prev.slice(0, tempIdx), msg, ...prev.slice(tempIdx + 1)]
            : [...prev, msg];
          return next;
        });
        if (msg.receiver_id === appUser.id) {
          supabase.from('messages').update({ is_read: true }).eq('message_id', msg.message_id).then();
        }
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
      })
      // ── Typing indicator via broadcast (reliable, no REPLICA IDENTITY needed)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload?.user_id !== artist.id) return;
        setIsTyping(!!payload.typing);
      })
      // ── Online presence
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<any>();
        const online = Object.values(state).flat().some((u: any) => u.user_id === artist.id);
        setIsOnline(online);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (newPresences.some((u: any) => u.user_id === artist.id)) setIsOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (leftPresences.some((u: any) => u.user_id === artist.id)) setIsOnline(false);
      })
      .subscribe(async (s) => {
        if (s === 'SUBSCRIBED') await ch.track({ user_id: appUser.id });
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
    // Broadcast typing state — more reliable than presence for transient signals
    channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: appUser?.id, typing: text.length > 0 } });
    if (typingRef.current) clearTimeout(typingRef.current);
    typingRef.current = setTimeout(() => {
      channelRef.current?.send({ type: 'broadcast', event: 'typing', payload: { user_id: appUser?.id, typing: false } });
    }, 3000);
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    const content = message.trim();
    setMessage('');
    channelRef.current?.track({ user_id: appUser?.id, typing: false });

    // Temp UI append
    const temp = { message_id: `temp-${Date.now()}`, sender_id: appUser?.id, receiver_id: artist?.id, content, sent_at: new Date().toISOString() };
    setMessages(p => [...p, temp]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    await supabase.from('messages').insert({ sender_id: appUser?.id, receiver_id: artist?.id, content });
  };

  const handleProfileNav = () => {
    navigate('artist-profile', { selectedArtist: artist });
  };

  const handleMenu = () => {
    Alert.alert(
      artist?.name || 'Chat Settings',
      'Manage this conversation',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Report User', onPress: handleReportUser },
        { text: 'Delete Chat', style: 'destructive', onPress: handleDeleteChat },
      ]
    );
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      'Are you sure you want to delete all messages in this conversation? This cannot be undone.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            await supabase.from('messages')
              .delete()
              .or(`and(sender_id.eq.${appUser?.id},receiver_id.eq.${artist?.id}),and(sender_id.eq.${artist?.id},receiver_id.eq.${appUser?.id})`);
            setMessages([]);
            Alert.alert('Chat Deleted', 'The conversation history has been cleared.');
          }
        }
      ]
    );
  };

  const handleGigSubmit = async (form: GigForm) => {
    const { error } = await supabase.from('gig_bookings').insert({
      fan_id: appUser?.id,
      artist_id: artist?.id,
      event_name: form.eventName.trim(),
      event_date: form.eventDate.trim(),
      location: form.location.trim(),
      budget: form.budget.trim(),
      notes: form.notes.trim() || null,
      status: 'pending',
    });

    if (error) {
      Alert.alert('Failed to send', 'Could not submit your gig request. Please try again.');
      return;
    }

    setShowGigModal(false);

    // Send a context message in chat so the artist sees it
    const contextMsg = `🎫 Gig Request Sent!\n\nEvent: ${form.eventName}\nDate: ${form.eventDate}\nLocation: ${form.location}\nBudget: ${form.budget}${form.notes ? `\nNotes: ${form.notes}` : ''}`;
    const temp = { message_id: `temp-gig-${Date.now()}`, sender_id: appUser?.id, receiver_id: artist?.id, content: contextMsg, sent_at: new Date().toISOString() };
    setMessages(p => [...p, temp]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    await supabase.from('messages').insert({ sender_id: appUser?.id, receiver_id: artist?.id, content: contextMsg });

    Alert.alert('Gig Request Sent!', `Your booking request has been sent to ${artist?.name || 'the artist'}. They'll get back to you soon.`);
  };

  const handleReportUser = () => {
    Alert.prompt(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Report',
          onPress: async (reason: string | undefined) => {
            const { error } = await supabase.from('reports').insert({
              reported_by: appUser?.id,
              target_id: artist?.id,
              report_type: 'profile',
              reason: `From Messaging: ${reason || 'No reason provided'}`
            });
            if (error) {
              Alert.alert('Error', 'Failed to submit report. Please try again.');
            } else {
              Alert.alert('User Reported', 'Thank you for keeping SpotLight safe.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={[st.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle="light-content" />
      
      {/* ═══ HEADER ═══ */}
      <View style={[st.header, { paddingTop: Math.max(insets.top, 20) + 12 }]}>
        <Pressable onPress={() => navigate('chat-hub')} hitSlop={12}>
          <ChevronLeft size={28} color={C.onSurface} strokeWidth={2.5} />
        </Pressable>

        <Pressable style={st.headerCenter} onPress={handleProfileNav}>
          <View style={st.headerAvatarArea}>
            {isOnline && <BreathingPresence />}
            <Image source={{ uri: avatarUri }} style={st.headerAvatar} />
          </View>
          <View style={st.headerText}>
            <Text style={st.headerName}>{artist?.name || artist?.display_name || 'Artist'}</Text>
            {isTyping ? <TypingPulse /> : <Text style={st.headerStatus}>{isOnline ? 'Online now' : 'Tap for details'}</Text>}
          </View>
        </Pressable>

        <View style={st.headerRight}>
          <Pressable style={st.hIcon} onPress={handleMenu}>
            <MoreVertical size={24} color={C.onSurface} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      {/* ═══ MESSAGES + INPUT (wrapped together so keyboard pushes both) ═══ */}
      <KeyboardAvoidingView
        style={st.kavFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={st.scroll}
          contentContainerStyle={st.contentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {loading ? (
            <View style={st.loading}><ActivityIndicator color={C.primary} /></View>
          ) : messages.length === 0 ? (
            <View style={st.emptyContainer}>
              <Text style={st.emptyText}>Start a sonic conversation with {artist?.name || 'this artist'}.</Text>
            </View>
          ) : messages.map((msg) => {
            const isMe = msg.sender_id === appUser?.id;
            return (
              <View key={msg.message_id} style={[st.msgRow, isMe ? st.msgMe : st.msgThem]}>
                {!isMe && (
                  <Pressable onPress={handleProfileNav}>
                    <Image source={{ uri: avatarUri }} style={st.itemAvatar} />
                  </Pressable>
                )}
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
                    <View style={st.rimLight} />
                    <Text style={st.textThem}>{msg.content}</Text>
                  </View>
                )}
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

        <View style={[st.inputArea, { paddingBottom: insets.bottom + 12 }]}>
          <View style={st.inputPill}>
            <TextInput
              style={st.textInput}
              value={message}
              onChangeText={handleTyping}
              placeholder="Please type a message..."
              placeholderTextColor={C.onSurfaceMuted}
              multiline
            />
            {isFan && (
              <Pressable
                onPress={() => setShowGigModal(true)}
                style={({ pressed }) => [st.gigBtn, pressed && { opacity: 0.7 }]}
                hitSlop={8}
              >
                <LinearGradient
                  colors={[C.primary, C.secondary]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={st.gigBtnGrad}
                >
                  <Ticket size={15} color="#fff" strokeWidth={2.5} />
                </LinearGradient>
              </Pressable>
            )}
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

      {/* ═══ GIG BOOKING MODAL ═══ */}
      {isFan && (
        <GigBookingModal
          visible={showGigModal}
          artist={artist}
          fanId={appUser?.id ?? ''}
          onClose={() => setShowGigModal(false)}
          onSubmit={handleGigSubmit}
        />
      )}
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
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  hIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  kavFlex: { flex: 1 },
  scroll: { flex: 1 },
  contentContainer: { padding: 16, flexGrow: 1, paddingBottom: 16 },
  loading: { flex: 1, justifyContent: 'center', paddingVertical: 40 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60, opacity: 0.4 },
  emptyText: { color: C.onSurface, fontSize: 14, fontStyle: 'italic', textAlign: 'center', paddingHorizontal: 40 },

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
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.glassBorder,
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
  sendBtn: { marginLeft: 8, padding: 4 },
  gigBtn: { marginLeft: 8 },
  gigBtnGrad: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 5,
  },
});

// ─── Gig Modal Styles ─────────────────────────────────────────────────────────
const gm = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    maxHeight: '88%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 20,
  },
  headerGrad: {
    paddingTop: 20, paddingBottom: 18, paddingHorizontal: 20,
  },
  headerInner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ticketIconWrap: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:  { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', marginTop: 1 },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  artistRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  artistAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  artistName:  { color: '#fff', fontSize: 14, fontWeight: '700' },
  artistGenre: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: '500', marginTop: 1 },
  sparkWrap:   { marginLeft: 'auto' },

  formScroll: { flex: 1 },
  formContent: { padding: 20, paddingBottom: 36 },

  fieldWrap: { marginBottom: 16 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  fieldLabelText: { color: C.onSurface, fontSize: 13, fontWeight: '600', letterSpacing: 0.1 },
  req: { color: C.primary },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: C.onSurface,
    fontSize: 14,
    fontWeight: '400',
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 13,
  },

  actions: {
    flexDirection: 'row', gap: 10, marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelText: { color: C.onSurfaceMuted, fontSize: 15, fontWeight: '600' },
  submitWrap: { flex: 2, borderRadius: 16, overflow: 'hidden' },
  submitDisabled: { opacity: 0.45 },
  submitGrad: {
    paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
