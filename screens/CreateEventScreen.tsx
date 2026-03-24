import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Pressable } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Upload, X, Calendar } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

interface Props {
    navigate: (screen: string, data?: any) => void;
    route?: any;
}

interface ArtistOption {
    user_id: string;
    display_name?: string | null;
    username?: string | null;
    genres?: string[] | string | null;
    city?: string | null;
    avatar_url?: string | null;
    profile_image_url?: string | null;
    invite_status?: 'pending' | 'accepted';
    invited_at?: string | null;
    accepted_at?: string | null;
}

export default function CreateEventScreen({ navigate, route }: Props) {
    const { appUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [posterUri, setPosterUri] = useState<string | null>(null);
    const [searchingArtists, setSearchingArtists] = useState(false);
    const [artistQuery, setArtistQuery] = useState('');
    const [artistResults, setArtistResults] = useState<ArtistOption[]>([]);
    const [selectedArtists, setSelectedArtists] = useState<ArtistOption[]>([]);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [locationName, setLocationName] = useState('');
    const [city, setCity] = useState('');
    const [ticketPrice, setTicketPrice] = useState('');
    const [totalTickets, setTotalTickets] = useState('');
    const [availableTickets, setAvailableTickets] = useState(''); // Hidden state for edit mode

    const params = route?.params ?? {};
    const mode = params.mode ?? 'create';
    const event = params.event ?? null;
    const isEditMode = mode === 'edit';

    useEffect(() => {
        if (isEditMode && event) {
            setTitle(event.title || '');
            setDescription(event.description || '');
            setDate(new Date(event.event_date));
            setLocationName(event.location_name || '');
            setCity(event.city || '');
            setTicketPrice(event.ticket_price?.toString() || '');
            setTotalTickets(event.total_tickets?.toString() || '');
            setAvailableTickets(event.available_tickets?.toString() || '');
            setPosterUri(event.poster_url || null);
        }
    }, [isEditMode, event]);

    useEffect(() => {
        if (!isEditMode || !event) return;
        const rawLineup = event.lineup_artists;
        if (!rawLineup) {
            setSelectedArtists([]);
            return;
        }
        if (Array.isArray(rawLineup)) {
            setSelectedArtists(rawLineup as ArtistOption[]);
            return;
        }
        try {
            const parsed = JSON.parse(rawLineup);
            setSelectedArtists(Array.isArray(parsed) ? (parsed as ArtistOption[]) : []);
        } catch {
            setSelectedArtists([]);
        }
    }, [isEditMode, event]);

    useEffect(() => {
        let active = true;
        const searchArtists = async () => {
            const query = artistQuery.trim();
            if (!query) {
                setArtistResults([]);
                return;
            }
            setSearchingArtists(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('user_id, display_name, username, genres, city, avatar_url, profile_image_url')
                    .or(`display_name.ilike.%${query}%,username.ilike.%${query}%,city.ilike.%${query}%`)
                    .limit(12);
                if (error) throw error;
                if (active) {
                    setArtistResults((data as ArtistOption[]) || []);
                }
            } catch (e) {
                console.error('Artist search failed:', e);
                if (active) setArtistResults([]);
            } finally {
                if (active) setSearchingArtists(false);
            }
        };
        const id = setTimeout(searchArtists, 250);
        return () => {
            active = false;
            clearTimeout(id);
        };
    }, [artistQuery]);

    const addArtist = (artist: ArtistOption) => {
        setSelectedArtists((prev) =>
            prev.some((a) => a.user_id === artist.user_id)
                ? prev
                : [...prev, { ...artist, invite_status: 'pending', invited_at: new Date().toISOString() }]
        );
    };

    const removeArtist = (artistId: string) => {
        setSelectedArtists((prev) => prev.filter((a) => a.user_id !== artistId));
    };

    const serializeLineupArtists = () =>
        selectedArtists.map((artist) => ({
            user_id: artist.user_id,
            display_name: artist.display_name || null,
            username: artist.username || null,
            genres: artist.genres || null,
            city: artist.city || null,
            avatar_url: artist.avatar_url || null,
            profile_image_url: artist.profile_image_url || null,
            invite_status: artist.invite_status || 'pending',
            invited_at: artist.invited_at || new Date().toISOString(),
            accepted_at: artist.accepted_at || null,
        }));

    const pickPoster = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [3, 4], // Portrait poster aspect ratio
                quality: 0.8,
            });

            if (!result.canceled) {
                setPosterUri(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking poster:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };

    const uploadPoster = async (uri: string, userId: string) => {
        const fileExt = uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        let fileData;
        if (Platform.OS === 'web') {
            const response = await fetch(uri);
            fileData = await response.blob();
        } else {
            fileData = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });
            fileData = Uint8Array.from(atob(fileData), c => c.charCodeAt(0)).buffer;
        }

        const { error: uploadError } = await supabase.storage
            .from('event-posters')
            .upload(filePath, fileData, {
                contentType: 'image/jpeg',
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('event-posters')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async () => {
        if (!title || !date || !locationName || !city || !ticketPrice || !totalTickets) {
            Alert.alert('Missing Fields', 'Please fill in all required fields.');
            return;
        }

        if (!appUser) {
            Alert.alert('Error', 'You must be logged in.');
            return;
        }

        setLoading(true);
        try {
            let posterUrl = event?.poster_url || null;
            if (posterUri && posterUri !== event?.poster_url) {
                posterUrl = await uploadPoster(posterUri, appUser.id);
            }

            if (isEditMode) {
                const { error } = await supabase
                    .from('events')
                    .update({
                        title,
                        description,
                        event_date: date.toISOString(),
                        location_name: locationName,
                        city,
                        ticket_price: parseFloat(ticketPrice),
                        total_tickets: parseInt(totalTickets),
                        available_tickets: (event.available_tickets || 0) + (parseInt(totalTickets) - (event.total_tickets || 0)),
                        poster_url: posterUrl,
                        lineup_artists: serializeLineupArtists(),
                        approval_status: 'pending', // Reset approval on update
                    })
                    .eq('event_id', event.event_id)
                    .eq('organizer_id', appUser.id);

                if (error) throw error;
                Alert.alert('Success', 'Event updated successfully! It is now pending approval.');
                navigate('event-details', { eventId: event.event_id });
            } else {
                const { data: insertedEvent, error } = await supabase
                    .from('events')
                    .insert({
                        organizer_id: appUser.id, // Using standard American spelling (likely key)
                        title,
                        description,
                        event_date: date.toISOString(),
                        location_name: locationName,
                        city,
                        ticket_price: parseFloat(ticketPrice),
                        total_tickets: parseInt(totalTickets),
                        available_tickets: parseInt(totalTickets),
                        poster_url: posterUrl,
                        lineup_artists: serializeLineupArtists(),
                        approval_status: 'pending',
                        is_deleted: false,
                    })
                    .select('event_id')
                    .single();

                if (error) throw error;
                if (!insertedEvent?.event_id) throw new Error('Failed to create event.');

                Alert.alert('Success', 'Event created successfully! It is now pending approval.');
                navigate('organizer-dashboard');
            }
        } catch (error: any) {
            console.error('Create event error:', error);
            Alert.alert('Error', error.message || 'Failed to create event.');
        } finally {
            setLoading(false);
        }
    };

    // mode="datetime" is iOS-only; Android requires separate date + time pickers
    const onDateChange = (event: any, selectedDate?: Date) => {
        if (event?.type === 'dismissed') {
            setShowDatePicker(false);
            setShowTimePicker(false);
            return;
        }
        if (!selectedDate) return;
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
            setDate(selectedDate);
            setShowTimePicker(true);
        } else {
            setDate(selectedDate);
            setShowDatePicker(false);
        }
    };

    const onTimeChange = (event: any, selectedTime?: Date) => {
        if (event?.type === 'dismissed') {
            setShowTimePicker(false);
            return;
        }
        if (selectedTime) {
            setDate((prev) => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate(), selectedTime.getHours(), selectedTime.getMinutes()));
            setShowTimePicker(false);
        }
    };

    return (
        <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Button variant="ghost" size="icon" onPress={() => navigate('organizer-dashboard')} disabled={loading}>
                        <ChevronLeft size={24} color="#fff" />
                    </Button>
                    <View>
                        <Text style={styles.title}>{isEditMode ? 'Edit Event' : 'Create Event'}</Text>
                        <Text style={styles.subtitle}>Build your event and curate the lineup</Text>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        <Card style={styles.formCard}>
                            {/* Poster Upload */}
                            <Pressable onPress={pickPoster} style={styles.posterUpload} disabled={loading}>
                                {posterUri ? (
                                    <>
                                        <Image source={{ uri: posterUri }} style={styles.posterImage} resizeMode="cover" />
                                        <Button variant="ghost" size="icon" style={styles.removePosterBtn} onPress={() => setPosterUri(null)}>
                                            <X size={20} color="#fff" />
                                        </Button>
                                    </>
                                ) : (
                                    <View style={styles.uploadPlaceholder}>
                                        <Upload size={32} color="rgba(255,255,255,0.4)" />
                                        <Text style={styles.uploadText}>Upload Event Poster</Text>
                                    </View>
                                )}
                            </Pressable>

                            {/* Form Fields */}
                            <Text style={styles.sectionLabel}>Event Details</Text>
                            <View style={styles.field}>
                                <Label>Event Title</Label>
                                <Input
                                    placeholder="e.g. Summer Jazz Night"
                                    value={title}
                                    onChangeText={setTitle}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.field}>
                                <Label>Description</Label>
                                <Textarea
                                    placeholder="Describe your event..."
                                    value={description}
                                    onChangeText={setDescription}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1 }]}>
                                    <Label>Date & Time</Label>
                                    <Pressable onPress={() => { setShowDatePicker(true); setShowTimePicker(false); }} style={styles.datePickerBtn} disabled={loading}>
                                        <Calendar size={20} color="rgba(255,255,255,0.6)" />
                                        <Text style={styles.dateText}>{date.toLocaleString()}</Text>
                                    </Pressable>
                                    {showDatePicker && (
                                        <DateTimePicker
                                            value={date}
                                            mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
                                            display="default"
                                            onChange={onDateChange}
                                            minimumDate={new Date()}
                                        />
                                    )}
                                    {showTimePicker && Platform.OS === 'android' && (
                                        <DateTimePicker
                                            value={date}
                                            mode="time"
                                            display="default"
                                            onChange={onTimeChange}
                                        />
                                    )}
                                </View>
                            </View>

                            <Text style={styles.sectionLabel}>Location</Text>
                            <View style={styles.field}>
                                <Label>Venue Name</Label>
                                <Input
                                    placeholder="e.g. The Grand Hall"
                                    value={locationName}
                                    onChangeText={setLocationName}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.field}>
                                <Label>City</Label>
                                <Input
                                    placeholder="e.g. New York"
                                    value={city}
                                    onChangeText={setCity}
                                    editable={!loading}
                                />
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                                    <Label>Ticket Price ($)</Label>
                                    <Input
                                        placeholder="0.00"
                                        value={ticketPrice}
                                        onChangeText={setTicketPrice}
                                        keyboardType="numeric"
                                        editable={!loading}
                                    />
                                </View>
                                <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
                                    <Label>Total Tickets</Label>
                                    <Input
                                        placeholder="100"
                                        value={totalTickets}
                                        onChangeText={setTotalTickets}
                                        keyboardType="numeric"
                                        editable={!loading}
                                    />
                                </View>
                            </View>

                            <Text style={styles.sectionLabel}>Lineup</Text>
                            <View style={styles.field}>
                                <Label>Add Artists to Lineup</Label>
                                <Input
                                    placeholder="Search artists by name, username or city"
                                    value={artistQuery}
                                    onChangeText={setArtistQuery}
                                    editable={!loading}
                                />
                                {searchingArtists ? (
                                    <ActivityIndicator color="#fff" style={{ marginTop: 10 }} />
                                ) : artistQuery.trim().length > 0 ? (
                                    <View style={styles.artistResultsWrap}>
                                        {artistResults.length === 0 ? (
                                            <Text style={styles.helperText}>No artists found.</Text>
                                        ) : (
                                            artistResults.map((artist) => {
                                                const alreadySelected = selectedArtists.some((a) => a.user_id === artist.user_id);
                                                const avatar = artist.avatar_url || artist.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
                                                const name = artist.display_name || (artist.username ? `@${artist.username}` : 'Artist');
                                                return (
                                                    <Pressable
                                                        key={artist.user_id}
                                                        style={styles.artistRow}
                                                        onPress={() => addArtist(artist)}
                                                        disabled={alreadySelected || loading}
                                                    >
                                                        <Image source={{ uri: avatar }} style={styles.artistAvatar} />
                                                        <View style={{ flex: 1 }}>
                                                            <Text style={styles.artistName}>{name}</Text>
                                                            <Text style={styles.artistMeta}>{artist.city || artist.username || 'Artist profile'}</Text>
                                                        </View>
                                                        <Text style={[styles.artistAction, alreadySelected && styles.artistActionDisabled]}>
                                                            {alreadySelected ? 'Added' : 'Add'}
                                                        </Text>
                                                    </Pressable>
                                                );
                                            })
                                        )}
                                    </View>
                                ) : null}
                            </View>

                            <View style={styles.field}>
                                <Label>Selected Lineup ({selectedArtists.length})</Label>
                                <View style={styles.selectedWrap}>
                                    {selectedArtists.length === 0 ? (
                                        <Text style={styles.helperText}>No artists selected yet.</Text>
                                    ) : (
                                        selectedArtists.map((artist) => {
                                            const avatar = artist.avatar_url || artist.profile_image_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop';
                                            const name = artist.display_name || (artist.username ? `@${artist.username}` : 'Artist');
                                            return (
                                                <View key={`selected-${artist.user_id}`} style={styles.artistRow}>
                                                    <Image source={{ uri: avatar }} style={styles.artistAvatar} />
                                                    <View style={{ flex: 1 }}>
                                                        <Text style={styles.artistName}>{name}</Text>
                                                        <Text style={styles.artistMeta}>{artist.city || artist.username || 'Artist profile'}</Text>
                                                    </View>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onPress={() => removeArtist(artist.user_id)}
                                                        disabled={loading}
                                                    >
                                                        <Text style={styles.removeText}>Remove</Text>
                                                    </Button>
                                                </View>
                                            );
                                        })
                                    )}
                                </View>
                            </View>

                            <Button style={[styles.submitBtn]} onPress={handleSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isEditMode ? 'Update Event' : 'Create Event'}</Text>}
                            </Button>
                        </Card>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    safeArea: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
    title: { fontSize: 24, fontWeight: '800', color: '#fff' },
    subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.62)', marginTop: 2 },
    keyboardView: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 40 },
    formCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.14)',
        borderRadius: 28,
        padding: 20,
    },
    sectionLabel: {
        color: 'rgba(255,255,255,0.58)',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        marginBottom: 10,
        marginTop: 4,
    },
    posterUpload: { width: '100%', height: 210, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, marginBottom: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    posterImage: { width: '100%', height: '100%' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { color: 'rgba(255,255,255,0.68)', fontSize: 14, fontWeight: '600' },
    removePosterBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)' },
    field: { marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.06)', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)' },
    dateText: { color: '#fff', fontWeight: '600' },
    helperText: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 8 },
    artistResultsWrap: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
    selectedWrap: { marginTop: 10, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden' },
    artistRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.08)' },
    artistAvatar: { width: 38, height: 38, borderRadius: 19 },
    artistName: { color: '#fff', fontSize: 14, fontWeight: '600' },
    artistMeta: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },
    artistAction: { color: '#22D3EE', fontWeight: '700', fontSize: 13 },
    artistActionDisabled: { color: 'rgba(255,255,255,0.45)' },
    removeText: { color: '#FDA4AF', fontWeight: '700' },
    submitBtn: { backgroundColor: '#FDF2FF', marginTop: 16, minHeight: 52, borderRadius: 100 },
    submitBtnText: { color: '#162447', fontWeight: '800', fontSize: 15 },
});
