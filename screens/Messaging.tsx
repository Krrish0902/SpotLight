import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Platform, KeyboardAvoidingView, SafeAreaView } from 'react-native';
import { Text } from '../components/ui/Text';
import { ChevronLeft, MoreHorizontal, Mic } from 'lucide-react-native';
import { Image } from 'expo-image';
import { Input } from '../components/ui/Input';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HingeArtistProfile } from '../components/HingeArtistProfile';
import { useGroupChannel } from '@sendbird/uikit-chat-hooks';
import { createGroupChannelFragment, useSendbirdChat, GroupChannelContexts } from '@sendbird/uikit-react-native';

interface Props {
  navigate: (screen: string, data?: any) => void;
  channelUrl?: string; // Expecting a Sendbird channel url when opened from matches
  artist?: any;
}

// Hardcoded deep purple core UI color from Hinge screenshots
const MAIN_PURPLE = '#752968';

const SendbirdChatFragment = createGroupChannelFragment();

export default function Messaging({ navigate, artist, channelUrl }: Props) {
  const insets = useSafeAreaInsets();
  const artistName = artist?.display_name || artist?.name || 'Artist';
  const artistAvatar = artist?.avatar_url || 'https://i.pravatar.cc/100';

  const [activeTab, setActiveTab] = useState<'Chat' | 'Profile'>('Chat');

  const { sdk } = useSendbirdChat();
  const { channel } = useGroupChannel(sdk, channelUrl || '');

  const handleBack = () => {
    navigate('matches'); // Route back to the main tabs list
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.headerIconBtn}>
            <ChevronLeft size={28} color="#000" />
          </Pressable>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitleText}>{artistName}</Text>
            {/* Fake verified badge */}
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedTick}>✓</Text>
            </View>
          </View>
          <Pressable style={styles.headerIconBtn}>
            <MoreHorizontal size={24} color="#000" />
          </Pressable>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <Pressable style={[styles.tab, activeTab === 'Chat' && styles.activeTab]} onPress={() => setActiveTab('Chat')}>
            <Text style={[styles.tabText, activeTab === 'Chat' && styles.activeTabText]}>Chat</Text>
          </Pressable>
          <View style={styles.tabDivider} />
          <Pressable style={[styles.tab, activeTab === 'Profile' && styles.activeTab]} onPress={() => setActiveTab('Profile')}>
            <Text style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>Profile</Text>
          </Pressable>
        </View>

        {activeTab === 'Chat' ? (
          <View style={{ flex: 1 }}>
             {channel ? (
                <SendbirdChatFragment
                  channel={channel}
                  onPressHeaderLeft={handleBack}
                  onPressHeaderRight={() => {}}
                  onChannelDeleted={handleBack}
                  keyboardAvoidOffset={Platform.OS === 'ios' ? insets.top + 50 : 0}
                />
             ) : (
                <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text>Loading Chat...</Text>
                </View>
             )}
          </View>
        ) : (
          <View style={styles.profileContainer}>
            <HingeArtistProfile
              profile={artist}
              isActive={true}
              onLike={() => { }}
              onReject={() => { }}
              onOptionsPress={() => { }}
            />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerIconBtn: {
    padding: 8,
  },
  profileContainer: {
    flex: 1,
    backgroundColor: '#121212', // Match the dark theme of the profile
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  verifiedBadge: {
    backgroundColor: MAIN_PURPLE,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedTick: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: MAIN_PURPLE, // Purple underline
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999', // Light grey for inactive
  },
  activeTabText: {
    color: MAIN_PURPLE, // Dark purple for active
  },
  tabDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#D0D0D0',
    transform: [{ rotate: '20deg' }], // Slanted divider
  },
  // Messages Area
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  messageGroup: {
    marginBottom: 20,
  },
  dateText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 16,
  },
  // Prompt Match (The large card)
  promptMatchContainer: {
    width: '100%',
    alignItems: 'center', // Centers the card
  },
  promptCard: {
    backgroundColor: '#F0F0F0', // Light grey card
    width: '90%',
    padding: 24,
    borderRadius: 12,
    borderBottomRightRadius: 2, // Connected to comment bubble
  },
  promptLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  promptAnswer: {
    fontSize: 26,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#000',
    lineHeight: 32,
    marginBottom: 12,
  },
  promptCommentWrapper: {
    width: '90%',
    alignItems: 'flex-end', // Aligns the comment to the right of the card
    marginTop: -4, // Overlap slightly to look connected
  },
  promptCommentBubble: {
    backgroundColor: '#EED9D5', // Matches exactly the light peach in screenshot
    padding: 16,
    borderRadius: 20,
    borderTopLeftRadius: 4, // Flattened corner connecting up to the white card
    maxWidth: '90%',
  },
  promptCommentText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 22,
  },
  // Standard Messages
  standardMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 6, // Tighter mapping for stacked blocks
  },
  standardMsgRowStacked: {
    marginBottom: 2,
  },
  standardMsgRowMe: {
    justifyContent: 'flex-end',
  },
  standardMsgRowThem: {
    justifyContent: 'flex-start',
    gap: 8,
  },
  messageAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ddd',
  },
  messageAvatarPlaceholder: {
    width: 36,
  },
  standardMsgBubble: {
    maxWidth: '75%',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  myBubble: {
    backgroundColor: MAIN_PURPLE,
  },
  myBubbleTail: {
    borderBottomRightRadius: 4, // The flat corner for the last sent message
  },
  theirBubble: {
    backgroundColor: '#EAEAEA', // Light grey
  },
  theirBubbleTail: {
    borderBottomLeftRadius: 4, // The flat corner for the last received message
  },
  standardMsgText: {
    fontSize: 15,
    color: '#000',
    lineHeight: 20,
  },
  myBubbleText: {
    color: '#FFF',
  },
  // Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 15,
    color: '#000',
    padding: 0,
    margin: 0,
    borderWidth: 0,
    backgroundColor: 'transparent',
    minHeight: 24,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
