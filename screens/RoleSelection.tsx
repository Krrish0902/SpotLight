import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Briefcase, Star } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useAuth, UserRole } from '../lib/auth-context';

interface Props {
  navigate: (screen: string) => void;
  setRole: (role: UserRole) => void;
}

export default function RoleSelection({ navigate, setRole }: Props) {
  const { appUser, profile, updateRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Returning users (login): go to home; dashboard is only through profile
  useEffect(() => {
    if (!appUser) return;
    if (appUser.role === 'artist') {
      setRole('artist');
      navigate('public-home');
      return;
    }
    if (appUser.role === 'organizer') {
      setRole('organizer');
      navigate('public-home');
      return;
    }
    if (appUser.role === 'public') {
      setRole('public');
      navigate('public-home');
      return;
    }
    if (appUser.role === 'admin') {
      setRole('admin');
      navigate('admin-dashboard');
    }
  }, [appUser?.role]);

  const handleRoleSelect = async (role: 'artist' | 'organizer' | 'public') => {
    setError(null);
    setLoading(true);
    const { error: err } = await updateRole(role);
    if (err) {
      setLoading(false);
      setError(err.message);
      Alert.alert('Something went wrong', err.message);
      return;
    }
    setLoading(false);
    const { posthog } = require('../lib/posthog');
    posthog.capture('role_selected', { role });
    setRole(role);
    navigate(profile ? 'public-home' : 'profile-setup');
  };

  const handleAdmin = async () => {
    setError(null);
    setLoading(true);
    const { error: err } = await updateRole('admin');
    setLoading(false);
    if (err) {
      setError(err.message);
      Alert.alert('Something went wrong', err.message);
      return;
    }
    setRole('admin');
    navigate('admin-dashboard');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join Spotlight</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={styles.cards}>
        <Card onPress={() => !loading && handleRoleSelect('artist')} style={styles.artistCard}>
          <LinearGradient colors={['#9333ea', '#db2777']} style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Music size={32} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>I'm an Artist</Text>
                <Text style={styles.cardDesc}>Showcase your talent and get booked for events</Text>
              </View>
            </View>
          </LinearGradient>
        </Card>

        <Card onPress={() => !loading && handleRoleSelect('organizer')} style={styles.organizerCard}>
          <LinearGradient colors={['#f97316', '#eab308']} style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Briefcase size={32} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>I'm an Organizer</Text>
                <Text style={styles.cardDesc}>Discover and book talented artists for your events</Text>
              </View>
            </View>
          </LinearGradient>
        </Card>

        <Card onPress={() => !loading && handleRoleSelect('public')} style={styles.fanCard}>
          <LinearGradient colors={['#0ea5e9', '#06b6d4']} style={styles.cardGradient}>
            <View style={styles.cardContent}>
              <View style={styles.iconCircle}>
                <Star size={32} color="#fff" />
              </View>
              <View style={styles.cardText}>
                <Text style={styles.cardTitle}>I'm here to explore</Text>
                <Text style={styles.cardDesc}>Discover artists, book tickets, and leave reviews</Text>
              </View>
            </View>
          </LinearGradient>
        </Card>
      </View>

      {loading ? <ActivityIndicator size="small" color="#a855f7" style={{ marginVertical: 8 }} /> : null}
      <Button variant="ghost" onPress={() => !loading && handleAdmin()} style={styles.adminBtn}>
        <Text style={styles.adminText}>Admin Access</Text>
      </Button>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  cards: {
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  artistCard: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  organizerCard: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  fanCard: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 32,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  adminBtn: { marginTop: 16 },
  adminText: { color: 'rgba(255,255,255,0.5)', fontSize: 14 },
  errorText: {
    color: '#f87171',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
});
