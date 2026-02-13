import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Music, Briefcase } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface Props {
  navigate: (screen: string) => void;
  setRole: (role: 'artist' | 'organizer' | 'admin' | 'public') => void;
}

export default function RoleSelection({ navigate, setRole }: Props) {
  const handleRoleSelect = (role: 'artist' | 'organizer') => {
    setRole(role);
    navigate('profile-setup');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Join ArtistHub</Text>
        <Text style={styles.subtitle}>Choose your role to get started</Text>
      </View>

      <View style={styles.cards}>
        <Card onPress={() => handleRoleSelect('artist')} style={styles.artistCard}>
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

        <Card onPress={() => handleRoleSelect('organizer')} style={styles.organizerCard}>
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
      </View>

        <Button variant="ghost" onPress={() => { setRole('admin'); navigate('admin-dashboard'); }} style={styles.adminBtn}>
          <Text style={styles.adminText}>Admin Access</Text>
        </Button>
        <Text style={styles.skip} onPress={() => navigate('public-home')}>
        Skip for now
      </Text>
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
  skip: {
    marginTop: 16,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
});
