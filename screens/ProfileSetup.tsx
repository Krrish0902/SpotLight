import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Camera, User, MapPin, Music } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { useAuth } from '../lib/auth-context';

interface Props {
  navigate: (screen: string) => void;
  userRole: 'artist' | 'organizer' | 'admin' | 'public';
}

export default function ProfileSetup({ navigate, userRole }: Props) {
  const { saveProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [genres, setGenres] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleComplete = async () => {
    const name = (userRole === 'organizer' ? company.trim() || displayName.trim() : displayName.trim());
    if (!name) {
      setError(userRole === 'organizer' ? 'Please enter company name.' : 'Please enter your name.');
      return;
    }
    setError(null);
    setLoading(true);

    const genresArr = genres.trim() ? genres.split(',').map((g) => g.trim()).filter(Boolean) : undefined;
    const { error: err } = await saveProfile({
      display_name: name,
      bio: bio.trim() || undefined,
      city: city.trim() || undefined,
      genres: userRole === 'artist' ? genresArr : undefined,
      instruments: userRole === 'artist' ? genresArr : undefined,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
      return;
    }
    if (userRole === 'artist') navigate('artist-dashboard');
    else if (userRole === 'organizer') navigate('organizer-dashboard');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('role-selection')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Setup Your Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarWrap}>
          <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.avatar}>
            <User size={64} color="#fff" />
          </LinearGradient>
          <View style={styles.cameraBtn}>
            <Camera size={20} color="#111" />
          </View>
        </View>

        <Card style={styles.card}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
            <Input
              leftIcon={<MapPin size={20} color="rgba(255,255,255,0.4)" />}
              placeholder="City, State"
              value={city}
              onChangeText={setCity}
            />
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
          <Button onPress={handleComplete} style={styles.completeBtn} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.completeText}>Complete Setup</Text>}
          </Button>
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
  cameraBtn: { position: 'absolute', bottom: 0, right: '50%', marginRight: -70, width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: 'rgba(17,24,39,0.5)', padding: 24 },
  field: { marginBottom: 20 },
  errorText: { color: '#f87171', fontSize: 14, marginBottom: 12 },
  completeBtn: { backgroundColor: '#a855f7', marginTop: 24 },
  completeText: { color: '#fff', fontSize: 16 },
});
