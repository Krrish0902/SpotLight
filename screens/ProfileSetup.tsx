import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Camera, User, MapPin, Music } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';

interface Props {
  navigate: (screen: string) => void;
  userRole: 'artist' | 'organizer' | 'admin' | 'public';
}

export default function ProfileSetup({ navigate, userRole }: Props) {
  const handleComplete = () => {
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
          <View style={styles.field}>
            <Label>Full Name</Label>
            <Input placeholder="Enter your name" />
          </View>
          {userRole === 'artist' && (
            <>
              <View style={styles.field}>
                <Label>Genre</Label>
                <Input leftIcon={<Music size={20} color="rgba(255,255,255,0.4)" />} placeholder="e.g., Jazz, Rock, Electronic" />
              </View>
              <View style={styles.field}>
                <Label>Bio</Label>
                <Textarea placeholder="Tell us about yourself and your music" />
              </View>
            </>
          )}
          <View style={styles.field}>
            <Label>Location</Label>
            <Input leftIcon={<MapPin size={20} color="rgba(255,255,255,0.4)" />} placeholder="City, State" />
          </View>
          {userRole === 'organizer' && (
            <View style={styles.field}>
              <Label>Company/Organization</Label>
              <Input placeholder="Enter company name" />
            </View>
          )}
          <Button onPress={handleComplete} style={styles.completeBtn}>
            <Text style={styles.completeText}>Complete Setup</Text>
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
  completeBtn: { backgroundColor: '#a855f7', marginTop: 24 },
  completeText: { color: '#fff', fontSize: 16 },
});
