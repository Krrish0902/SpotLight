import React from 'react';
import { View, StyleSheet, Platform, SafeAreaView } from 'react-native';
import { Text } from '../components/ui/Text';
import { ChevronUp, HelpCircle } from 'lucide-react-native';
import { createGroupChannelListFragment } from '@sendbird/uikit-react-native';
import { useAuth } from '../lib/auth-context';

interface Props {
    navigate: (screen: string, data?: any) => void;
}

const MAIN_PURPLE = '#752968';

const MatchesHeader = () => (
    <View style={styles.headerContainer}>
        {/* Header Title */}
        <Text style={styles.headerTitle}>Messages</Text>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your turn</Text>
            <ChevronUp size={20} color="#000" />
        </View>

        {/* Limit Banner */}
        <View style={styles.bannerContainer}>
            <View style={styles.bannerHeaderRow}>
                <Text style={styles.bannerTitle}>You're nearing the limit</Text>
                <View style={styles.helpIconBg}>
                    <HelpCircle size={14} color="#fff" />
                </View>
            </View>
            <Text style={styles.bannerText}>
                When 8 or more people are waiting for your reply, you need to either reply or end chats. Then you will be able to send likes.
            </Text>
            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: '85%' }]} />
            </View>
        </View>
    </View>
);

const GroupChannelListFragment = createGroupChannelListFragment({
    Header: MatchesHeader,
});

export default function Matches({ navigate }: Props) {
    const { profile } = useAuth();
    
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <GroupChannelListFragment
                    channelListQueryParams={{
                        includeEmpty: true,
                    }}
                    onPressCreateChannel={() => {}}
                    onPressChannel={(channel) => {
                        navigate('messaging', { channelUrl: channel.url, returnTo: 'matches' });
                    }}
                />
            </View>
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
    headerContainer: {
        backgroundColor: '#fff',
        paddingTop: 20,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        paddingHorizontal: 20,
        marginTop: 0,
        marginBottom: 32,
        fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    // Limit Banner
    bannerContainer: {
        backgroundColor: '#F0F0F0',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 20,
        marginBottom: 24,
    },
    bannerHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    bannerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    helpIconBg: {
        backgroundColor: MAIN_PURPLE,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: {
        fontSize: 14,
        color: '#444',
        lineHeight: 20,
        marginBottom: 16,
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: '#D1BAD7', // Light purple track
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: MAIN_PURPLE,
        borderRadius: 4,
    },

});
