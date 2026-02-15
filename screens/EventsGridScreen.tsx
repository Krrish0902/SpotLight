import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Calendar, AlertCircle } from 'lucide-react-native';
import { Card } from '../components/ui/Card';
import BottomNav from '../components/layout/BottomNav';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2; // 24px padding on sides, 12px gap

interface Event {
    event_id: string;
    title: string;
    event_date: string;
    location_name: string;
    poster_url: string | null;
}

interface Props {
    navigate: (screen: string, data?: any) => void;
}

export default function EventsGridScreen({ navigate }: Props) {
    const { appUser } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select('event_id, title, event_date, location_name, poster_url')
                .eq('approval_status', 'approved')
                .eq('is_deleted', false)
                .gte('event_date', new Date().toISOString())
                .order('event_date', { ascending: true });

            if (error) throw error;
            setEvents(data || []);
        } catch (error) {
            console.error('Error fetching events:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: Event }) => (
        <Pressable onPress={() => navigate('event-details', { eventId: item.event_id })}>
            <Card style={styles.card}>
                <Image
                    source={{ uri: item.poster_url || 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=600&fit=crop' }}
                    style={styles.poster}
                    resizeMode="cover"
                />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.metaRow}>
                        <Calendar size={12} color="#a855f7" />
                        <Text style={styles.metaText}>{new Date(item.event_date).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.metaRow}>
                        <MapPin size={12} color="#a855f7" />
                        <Text style={styles.metaText} numberOfLines={1}>{item.location_name}</Text>
                    </View>
                </View>
            </Card>
        </Pressable>
    );

    return (
        <LinearGradient colors={['#030712', '#000']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Upcoming Events</Text>
                </View>

                {loading ? (
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color="#a855f7" />
                    </View>
                ) : events.length === 0 ? (
                    <View style={styles.center}>
                        <AlertCircle size={48} color="rgba(255,255,255,0.2)" />
                        <Text style={styles.emptyText}>No upcoming events found.</Text>
                    </View>
                ) : (
                    <FlatList
                        data={events}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.event_id}
                        numColumns={2}
                        contentContainerStyle={styles.listContent}
                        columnWrapperStyle={styles.columnWrapper}
                        showsVerticalScrollIndicator={false}
                    />
                )}

                <BottomNav activeTab="events" navigate={navigate} userRole={appUser?.role} isAuthenticated={!!appUser} />
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { padding: 24, paddingBottom: 16 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
    emptyText: { color: 'rgba(255,255,255,0.5)', fontSize: 16 },
    listContent: { padding: 24, paddingBottom: 100 },
    columnWrapper: { gap: 12 },
    card: {
        width: COLUMN_WIDTH,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        padding: 0,
        borderWidth: 0,
    },
    poster: {
        width: '100%',
        aspectRatio: 2 / 3, // Maintain 2:3 aspect ratio
    },
    gradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60%',
    },
    info: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 12,
    },
    title: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 8,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    metaText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 10,
        flex: 1,
    },
});
