import React, { useEffect } from 'react';
import { View, ScrollView, StyleSheet, Dimensions, Platform, Pressable } from 'react-native';
import { Text } from './ui/Text';
import { Heart, X, MoreHorizontal } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 16;
const CARD_WIDTH = width - CARD_MARGIN * 2;

export interface HingeProfileData {
    user_id: string;
    display_name: string;
    username: string;
    bio?: string;
    city?: string;
    genres?: string[] | string;
    avatar_url?: string;
    cover_url?: string;
    videos: {
        video_id: string;
        video_url: string;
        thumbnail_url?: string;
        title?: string;
        description?: string;
    }[];
}

interface Props {
    profile: HingeProfileData;
    isActive: boolean;
    onLike: () => void;
    onReject: () => void;
    onOptionsPress: () => void;
}

// Sub-component for Video to maintain own state
function VideoCard({ url, isActive, isFirst, isLast, onLike, onReject }: { url: string, isActive: boolean, isFirst?: boolean, isLast?: boolean, onLike: () => void, onReject: () => void }) {
    const player = useVideoPlayer(url, (p) => {
        p.loop = true;
        p.muted = false;
    });

    useEffect(() => {
        if (isActive) {
            player.play();
        } else {
            player.pause();
        }
    }, [isActive, player]);

    return (
        <View style={styles.mediaCard}>
            <VideoView
                player={player}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                nativeControls={false}
            />
            <View style={styles.cardActions}>
                {isFirst && <View style={{ flex: 1 }} />}
                {!isFirst && (
                    <Pressable style={styles.actionBtnReject} onPress={onReject}>
                        <X size={24} color="#aaaaaa" strokeWidth={3} />
                    </Pressable>
                )}
                <Pressable style={styles.actionBtnLike} onPress={onLike}>
                    <Heart size={24} color="#C8A2C8" strokeWidth={2.5} />
                </Pressable>
            </View>
        </View>
    );
}

// Sub-component for Photo
function PhotoCard({ url, isFirst, isLast, onLike, onReject }: { url: string, isFirst?: boolean, isLast?: boolean, onLike: () => void, onReject: () => void }) {
    return (
        <View style={styles.mediaCard}>
            <Image
                source={{ uri: url }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
            />
            <View style={styles.cardActions}>
                {isFirst && <View style={{ flex: 1 }} />}
                {!isFirst && (
                    <Pressable style={styles.actionBtnReject} onPress={onReject}>
                        <X size={24} color="#aaaaaa" strokeWidth={3} />
                    </Pressable>
                )}
                <Pressable style={styles.actionBtnLike} onPress={onLike}>
                    <Heart size={24} color="#C8A2C8" strokeWidth={2.5} />
                </Pressable>
            </View>
        </View>
    );
}

// Sub-component for Text Prompt
function PromptCard({ prompt, answer, onLike }: { prompt: string, answer: string, onLike: () => void }) {
    return (
        <View style={styles.textCard}>
            <Text style={styles.promptLabel}>{prompt}</Text>
            <Text style={styles.promptAnswer}>{answer}</Text>
            <View style={styles.promptAction}>
                <Pressable style={styles.actionBtnLikeSmall} onPress={onLike}>
                    <Heart size={20} color="#C8A2C8" strokeWidth={2.5} />
                </Pressable>
            </View>
        </View>
    );
}

export function HingeArtistProfile({ profile, isActive, onLike, onReject, onOptionsPress }: Props) {
    const insets = useSafeAreaInsets();

    // Construct cards array
    const cards: any[] = [];

    // 1. Initial Media (Avatar, Cover, or first Video)
    if (profile.videos && profile.videos.length > 0) {
        cards.push({ type: 'video', data: profile.videos[0].video_url });
    } else if (profile.avatar_url) {
        cards.push({ type: 'photo', data: profile.avatar_url });
    } else if (profile.cover_url) {
        cards.push({ type: 'photo', data: profile.cover_url });
    }

    // 2. Bio Prompt
    if (profile.bio) {
        cards.push({ type: 'prompt', prompt: 'A little about me...', answer: profile.bio });
    }

    // 3. Second Video
    if (profile.videos && profile.videos.length > 1) {
        cards.push({ type: 'video', data: profile.videos[1].video_url });
    } else if (profile.cover_url && cards[0]?.data !== profile.cover_url) {
        cards.push({ type: 'photo', data: profile.cover_url });
    }

    // 4. Genres Prompt
    if (profile.genres) {
        const genresStr = Array.isArray(profile.genres) ? profile.genres.join(', ') : profile.genres;
        cards.push({ type: 'prompt', prompt: 'My music style is...', answer: genresStr });
    }

    // 5. Third Video
    if (profile.videos && profile.videos.length > 2) {
        cards.push({ type: 'video', data: profile.videos[2].video_url });
    }

    // 6. City Prompt
    if (profile.city) {
        cards.push({ type: 'prompt', prompt: 'Find me performing in...', answer: profile.city });
    }

    // If we have no cards at all (empty profile)
    if (cards.length === 0) {
        cards.push({ type: 'prompt', prompt: 'Profile Status', answer: 'This artist hasn\'t added any content yet.' });
    }

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Top Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{profile.display_name || profile.username || 'Artist'}</Text>
                <Pressable onPress={onOptionsPress} style={styles.optionsBtn}>
                    <MoreHorizontal size={28} color="#000" />
                </Pressable>
            </View>

            {/* Scrollable Feed */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
            >
                {cards.map((card, index) => {
                    const isFirst = index === 0;
                    const isLast = index === cards.length - 1;

                    if (card.type === 'video') {
                        return <VideoCard key={`vid-${index}`} url={card.data} isActive={isActive} isFirst={isFirst} isLast={isLast} onLike={onLike} onReject={onReject} />;
                    } else if (card.type === 'photo') {
                        return <PhotoCard key={`pic-${index}`} url={card.data} isFirst={isFirst} isLast={isLast} onLike={onLike} onReject={onReject} />;
                    } else {
                        return <PromptCard key={`prmpt-${index}`} prompt={card.prompt} answer={card.answer} onLike={onLike} />;
                    }
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background, // Light background for the app theme
        width: width, // Full width for the pager
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: colors.background,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.foreground, // Dark text on light background
    },
    optionsBtn: {
        padding: 4,
    },
    scrollContent: {
        paddingHorizontal: CARD_MARGIN,
        gap: 16, // Space between cards
    },
    // Text Card Styles
    textCard: {
        backgroundColor: colors.card, // White card background
        borderRadius: 12,
        padding: 24,
        paddingBottom: 48, // Room for the like button
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 2,
        minHeight: 180,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    promptLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6b7280', // Darker grey for label
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 16,
    },
    promptAnswer: {
        fontSize: 28,
        fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
        color: colors.foreground, // Black prompt text
        lineHeight: 34,
    },
    promptAction: {
        position: 'absolute',
        bottom: 16,
        right: 16,
    },
    actionBtnLikeSmall: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#ffffff', // White button background
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },

    // Media Card Styles
    mediaCard: {
        width: CARD_WIDTH,
        height: CARD_WIDTH * 1.25, // 4:5 aspect ratio typical for portraits
        backgroundColor: colors.card,
        borderRadius: 12,
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    cardActions: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    actionBtnReject: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    actionBtnLike: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#ffffff',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
});
