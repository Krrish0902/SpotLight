import React, { useState, useEffect } from 'react';
import { View, ScrollView, Alert, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated, { SlideInUp } from 'react-native-reanimated';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Text } from '../components/ui/Text';
import { ChevronLeft, Camera, User, MapPin, Music2, Guitar, Crosshair } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { MultiSelectWithCustom, POPULAR_GENRES, POPULAR_INSTRUMENTS } from '../components/MultiSelectWithCustom';
import { useAuth } from '../lib/auth-context';
import { supabase } from '../lib/supabase';

interface Props {
  navigate: (screen: string, data?: any) => void;
  userRole: 'artist' | 'organizer' | 'admin' | 'public';
  mode?: 'setup' | 'edit';
  returnTo?: string;
}

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/;

export default function ProfileSetup({ navigate, userRole, mode = 'setup', returnTo }: Props) {
  const { saveProfile, profile, fetchProfile } = useAuth();
  const isEdit = mode === 'edit';

  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [instruments, setInstruments] = useState<string[]>([]);
  const [company, setCompany] = useState('');
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [ageRange, setAgeRange] = useState('');
  const [gender, setGender] = useState('');

  const AGE_OPTIONS = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

  React.useEffect(() => {
    if (isEdit && profile) {
      setUsername(profile.username ?? '');
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
      setBio(profile.bio ?? '');
      setCity(profile.city ?? '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
      setGenres(profile.genres ?? []);
      setInstruments(profile.instruments ?? []);
      setAgeRange(profile.age_range ?? '');
      setGender(profile.gender ?? '');
      if (userRole === 'organizer') setCompany(profile.display_name ?? '');
    }
  }, [isEdit, profile, userRole]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled && result.assets?.length) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const filePath = `${user.id}/avatar.jpg`;
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrlWithTime = `${publicUrl}?t=${Date.now()}`;
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);
      if (dbError) throw dbError;
      setAvatarUrl(publicUrlWithTime);
      if (fetchProfile) await fetchProfile();
    } catch (e: unknown) {
      Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const captureLocation = async () => {
    setCapturingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location access is required to capture your coordinates.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLatitude(loc.coords.latitude);
      setLongitude(loc.coords.longitude);
      try {
        const [addr] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (addr?.city || addr?.region) {
          setCity([addr.city, addr.region].filter(Boolean).join(', ') || city);
        }
      } catch {
        // Keep current city if reverse geocode fails
      }
    } catch (e: unknown) {
      Alert.alert('Location error', e instanceof Error ? e.message : 'Could not get your location.');
    } finally {
      setCapturingLocation(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    const name = (userRole === 'organizer' ? company.trim() || displayName.trim() : displayName.trim());
    if (!name) {
      setError(userRole === 'organizer' ? 'Please enter company name.' : 'Please enter your name.');
      return;
    }
    const u = username.trim().toLowerCase();
    if (u && !USERNAME_REGEX.test(u)) {
      setError('Username: 3-30 chars, only letters, numbers, underscores. Use lowercase.');
      return;
    }
    setError(null);
    setLoading(true);

    const { error: err } = await saveProfile({
      username: u || undefined,
      display_name: name,
      bio: bio.trim() || undefined,
      city: city.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      genres: (userRole === 'artist' || userRole === 'organizer') ? (genres.length ? genres : undefined) : undefined,
      instruments: (userRole === 'artist' || userRole === 'organizer') ? (instruments.length ? instruments : undefined) : undefined,
      age_range: ageRange || undefined,
      gender: gender || undefined,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
      return;
    }
    if (isEdit && returnTo) navigate(returnTo, { selectedArtist: { id: 'me' } });
    else navigate('public-home');
  };

  const goBack = () => {
    if (isEdit && returnTo) {
      navigate(returnTo, { selectedArtist: { id: 'me' } });
    } else {
      navigate('role-selection');
    }
  };

  return (
        <View style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={goBack}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>{isEdit ? 'Edit Profile' : 'Setup Your Profile'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={SlideInUp.duration(600).springify().delay(100)} style={styles.avatarSection}>
          <Pressable style={styles.avatarWrap} onPress={handlePickImage} disabled={uploadingAvatar || loading}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={64} color="#8E8E93" />
              </View>
            )}
            <View style={styles.cameraBtn}>
              {uploadingAvatar ? <ActivityIndicator size="small" color="#162447" /> : <Camera size={20} color="#162447" />}
            </View>
          </Pressable>
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Animated.View entering={SlideInUp.duration(600).springify().delay(200)}>
          <View style={styles.bentoCard}>
            <Text style={styles.bentoTitle}>IDENTITY</Text>
            <View style={styles.field}>
              <Label>Username</Label>
              <Input
                placeholder="e.g. maya_rivers (unique, 3-30 chars)"
                value={username}
                onChangeText={(v) => setUsername(v.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Label>Full Name</Label>
              <Input
                placeholder="Enter your name"
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
          </View>
        </Animated.View>

        {(userRole === 'artist' || userRole === 'organizer') && (
          <Animated.View entering={SlideInUp.duration(600).springify().delay(300)}>
            <View style={styles.bentoCard}>
              <Text style={styles.bentoTitle}>ARTISTRY</Text>
              <View style={styles.field}>
                <MultiSelectWithCustom
                  label="Genres"
                  options={POPULAR_GENRES}
                  value={genres}
                  onChange={setGenres}
                  placeholder="Select genres or add custom"
                  leftIcon={<Music2 size={20} color="rgba(255,255,255,0.4)" />}
                />
              </View>
              <View style={styles.field}>
                <MultiSelectWithCustom
                  label="Instruments"
                  options={POPULAR_INSTRUMENTS}
                  value={instruments}
                  onChange={setInstruments}
                  placeholder="Select instruments or add custom"
                  leftIcon={<Guitar size={20} color="rgba(255,255,255,0.4)" />}
                />
              </View>
              {userRole === 'artist' && (
                <View style={styles.field}>
                  <Label>Bio</Label>
                  <Textarea
                    placeholder="Tell us about yourself and your music"
                    value={bio}
                    onChangeText={setBio}
                  />
                </View>
              )}
            </View>
          </Animated.View>
        )}

        <Animated.View entering={SlideInUp.duration(600).springify().delay(400)}>
          <View style={styles.bentoCard}>
            <Text style={styles.bentoTitle}>AUDIENCE & LOCATION</Text>
            <View style={styles.field}>
              <Label>Age Range</Label>
              <View style={styles.demographicRow}>
                {AGE_OPTIONS.map((opt) => (
                  <Pressable key={opt} onPress={() => setAgeRange(opt)} style={[styles.demoPill, ageRange === opt && styles.demoPillActive]}>
                    <Text style={[styles.demoPillText, ageRange === opt && styles.demoPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Label>Gender</Label>
              <View style={styles.demographicRow}>
                {GENDER_OPTIONS.map((opt) => (
                  <Pressable key={opt} onPress={() => setGender(opt)} style={[styles.demoPill, gender === opt && styles.demoPillActive]}>
                    <Text style={[styles.demoPillText, gender === opt && styles.demoPillTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.field}>
              <Label>Location</Label>
              <View style={styles.locationRow}>
                <Input
                  leftIcon={<MapPin size={20} color="rgba(255,255,255,0.4)" />}
                  placeholder="City, State"
                  value={city}
                  onChangeText={setCity}
                  containerStyle={styles.locationInput}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onPress={captureLocation}
                  disabled={capturingLocation}
                  style={styles.captureBtn}
                >
                  {capturingLocation ? (
                    <ActivityIndicator color="#FDF2FF" size="small" />
                  ) : (
                    <Crosshair size={18} color="#FDF2FF" />
                  )}
                </Button>
              </View>
              {(latitude != null && longitude != null) && (
                <Text style={styles.coordsText}>
                  lat: {latitude.toFixed(4)}, long: {longitude.toFixed(4)}
                </Text>
              )}
            </View>
          </View>
        </Animated.View>

        {userRole === 'organizer' && (
          <Animated.View entering={SlideInUp.duration(600).springify().delay(500)}>
            <View style={styles.bentoCard}>
              <Text style={styles.bentoTitle}>ORGANIZATION</Text>
              <View style={styles.field}>
                <Label>Company/Organization</Label>
                <Input
                  placeholder="Enter company name"
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
            </View>
          </Animated.View>
        )}

        <Animated.View entering={SlideInUp.duration(600).springify().delay(600)}>
          <View style={styles.buttonRow}>
            {isEdit && (
              <Button variant="outline" onPress={goBack} style={styles.cancelBtn} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Button>
            )}
            <Button onPress={handleComplete} style={styles.completeBtn} disabled={loading}>
              {loading ? <ActivityIndicator color="#162447" /> : <Text style={styles.completeText}>{isEdit ? 'Save Changes' : 'Complete Setup'}</Text>}
            </Button>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050A18' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 64, paddingBottom: 16 },
  title: { fontSize: 34, fontWeight: '800', color: '#ffffff', letterSpacing: -1 },
  scroll: { padding: 16, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: 40 },
  avatarWrap: { alignSelf: 'center', position: 'relative' },
  avatarImg: { width: 120, height: 120, borderRadius: 60, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#FDF2FF', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#050A18' },
  errorText: { color: '#FF3B30', fontSize: 15, fontWeight: '600', backgroundColor: 'rgba(255,59,48,0.15)', padding: 16, borderRadius: 16, marginBottom: 24 },
  bentoCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 32, borderRadius: 40, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  bentoTitle: { color: '#8E8E93', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 },
  field: { gap: 12, marginBottom: 24 },
  demographicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  demoPill: { backgroundColor: 'rgba(255,255,255,0.05)', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  demoPillActive: { backgroundColor: '#FDF2FF' },
  demoPillText: { color: '#ffffff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  demoPillTextActive: { color: '#162447', fontWeight: '800' },
  locationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  locationInput: { flex: 1, minWidth: 200, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 20, padding: 20, color: '#ffffff', fontSize: 18, fontWeight: '600' },
  captureBtn: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 20, justifyContent: 'center', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.15)' },
  coordsText: { color: '#8E8E93', fontSize: 13, marginTop: 12, fontWeight: '500' },
  buttonRow: { flexDirection: 'row', gap: 16, marginTop: 16 },
  cancelBtn: { flex: 1, minWidth: 100, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 100, paddingVertical: 20, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)' },
  cancelText: { color: '#ffffff', fontSize: 17, fontWeight: '700' },
  completeBtn: { flex: 2, minWidth: 200, backgroundColor: '#FDF2FF', borderRadius: 100, paddingVertical: 20, alignItems: 'center' },
  completeText: { color: '#162447', fontSize: 17, fontWeight: '700' },
});