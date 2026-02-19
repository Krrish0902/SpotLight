import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, Image, Pressable, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Camera, User, MapPin, Music, Crosshair } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
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
  const [genres, setGenres] = useState('');
  const [company, setCompany] = useState('');
  const [capturingLocation, setCapturingLocation] = useState(false);

  React.useEffect(() => {
    if (isEdit && profile) {
      setUsername(profile.username ?? '');
      setDisplayName(profile.display_name ?? '');
      setAvatarUrl((profile as any).avatar_url ?? null);
      setBio(profile.bio ?? '');
      setCity(profile.city ?? '');
      setLatitude(profile.latitude ?? null);
      setLongitude(profile.longitude ?? null);
      setGenres(profile.genres?.join(', ') ?? '');
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

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setUploadingAvatar(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filePath = `${user.id}/avatar.jpg`;
      
      // Read file as base64 and convert to ArrayBuffer for reliable upload
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });
      const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileData, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrlWithTime = `${publicUrl}?t=${new Date().getTime()}`;

      const { error: dbError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('user_id', user.id);
      if (dbError) throw dbError;

      setAvatarUrl(publicUrlWithTime);
      if (fetchProfile) await fetchProfile();
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
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
      const loc = await Location.getCurrentPositionAsync({ enableHighAccuracy: true });
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
    } catch (e: any) {
      Alert.alert('Location error', e.message || 'Could not get your location.');
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

    const genresArr = genres.trim() ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined;
    const { error: err } = await saveProfile({
      username: u || undefined,
      display_name: name,
      bio: bio.trim() || undefined,
      city: city.trim() || undefined,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
      genres: userRole === 'artist' ? genresArr : undefined,
      instruments: userRole === 'artist' ? genresArr : undefined,
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
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={goBack}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>{isEdit ? 'Edit Profile' : 'Setup Your Profile'}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.avatarWrap} onPress={handlePickImage} disabled={uploadingAvatar || loading}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
          ) : (
            <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.avatar}>
              <User size={64} color="#fff" />
            </LinearGradient>
          )}
          <View style={styles.cameraBtn}>
            {uploadingAvatar ? <ActivityIndicator size="small" color="#000" /> : <Camera size={20} color="#111" />}
          </View>
        </Pressable>

        <Card style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
          {userRole === 'artist' && (
            <>
              <View style={styles.field}>
                <Label>Genre</Label>
                <Input
                  leftIcon={<Music size={20} color="rgba(255,255,255,0.4)" />}
                  placeholder="e.g., Jazz, Rock, Electronic"
                  value={genres}
                  onChangeText={setGenres}
                />
              </View>
              <View style={styles.field}>
                <Label>Bio</Label>
                <Textarea
                  placeholder="Tell us about yourself and your music"
                  value={bio}
                  onChangeText={setBio}
                />
              </View>
            </>
          )}
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
                  <ActivityIndicator color="#a855f7" size="small" />
                ) : (
                  <Crosshair size={18} color="#a855f7" />
                )}
              </Button>
            </View>
            {(latitude != null && longitude != null) && (
              <Text style={styles.coordsText}>
                lat: {latitude.toFixed(4)}, long: {longitude.toFixed(4)}
              </Text>
            )}
          </View>
          {userRole === 'organizer' && (
            <View style={styles.field}>
              <Label>Company/Organization</Label>
              <Input
                placeholder="Enter company name"
                value={company}
                onChangeText={setCompany}
              />
            </View>
          )}
          <View style={styles.buttonRow}>
            {isEdit && (
              <Button variant="outline" onPress={goBack} style={styles.cancelBtn} disabled={loading}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Button>
            )}
            <Button onPress={handleComplete} style={styles.completeBtn} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeText}>{isEdit ? 'Save Changes' : 'Complete Setup'}</Text>}
            </Button>
          </View>
        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  scroll: { padding: 24, paddingBottom: 48 },
  avatarWrap: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 128, height: 128, borderRadius: 64, borderWidth: 2, borderColor: '#a855f7' },
  cameraBtn: { position: 'absolute', bottom: 0, right: '50%', marginRight: -70, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'rgba(17,24,39,0.5)', padding: 24 },
  field: { marginBottom: 20 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  locationInput: { flex: 1, minWidth: 0 },
  captureBtn: { width: 44, height: 44, padding: 0, borderColor: 'rgba(168,85,247,0.5)' },
  coordsText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 6 },
  errorText: { color: '#f87171', fontSize: 14, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'center' },
  cancelBtn: { flex: 1, borderColor: 'rgba(255,255,255,0.3)' },
  cancelText: { color: '#fff', fontSize: 16 },
  completeBtn: { flex: 1, backgroundColor: '#a855f7' },
  completeText: { color: '#fff', fontSize: 16 },
});
