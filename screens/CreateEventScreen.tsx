import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Image, Pressable } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Upload, X, Calendar, MapPin, DollarSign, Users } from 'lucide-react-native';
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
    navigate: (screen: string) => void;
}

export default function CreateEventScreen({ navigate }: Props) {
    const { appUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [posterUri, setPosterUri] = useState<string | null>(null);

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
            let posterUrl = null;
            if (posterUri) {
                posterUrl = await uploadPoster(posterUri, appUser.id);
            }

            const { error } = await supabase
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
                    approval_status: 'pending',
                    is_deleted: false,
                });

            if (error) throw error;

            Alert.alert('Success', 'Event created successfully! It is now pending approval.');
            navigate('organizer-dashboard');
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
        <LinearGradient colors={['#030712', '#000']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Button variant="ghost" size="icon" onPress={() => navigate('organizer-dashboard')} disabled={loading}>
                        <ChevronLeft size={24} color="#fff" />
                    </Button>
                    <Text style={styles.title}>Create Event</Text>
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

                            <Button style={[styles.submitBtn]} onPress={handleSubmit} disabled={loading}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Create Event</Text>}
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
    header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
    title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
    keyboardView: { flex: 1 },
    scrollContent: { padding: 16 },
    formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 20 },
    posterUpload: { width: '100%', height: 200, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, marginBottom: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    posterImage: { width: '100%', height: '100%' },
    uploadPlaceholder: { alignItems: 'center', gap: 8 },
    uploadText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
    removePosterBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)' },
    field: { marginBottom: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    datePickerBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    dateText: { color: '#fff' },
    submitBtn: { backgroundColor: '#a855f7', marginTop: 16 },
    submitBtnText: { color: '#fff', fontWeight: '600' },
});
