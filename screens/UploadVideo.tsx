import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Upload, Play, X } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';

interface Props { navigate: (screen: string) => void; }

export default function UploadVideo({ navigate }: Props) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');

  const handleUpload = () => {
    navigate('artist-dashboard');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Upload Video</Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.previewCard}>
          <View style={styles.previewBox}>
            {previewUrl ? (
              <>
                <Text style={styles.placeholderText}>Video preview</Text>
                <View style={styles.playBtn}><Play size={32} color="#fff" /></View>
                <Button variant="ghost" size="icon" style={styles.removeBtn} onPress={() => setPreviewUrl('')}>
                  <X size={20} color="#fff" />
                </Button>
              </>
            ) : (
              <View style={styles.uploadArea}>
                <Upload size={64} color="rgba(255,255,255,0.4)" />
                <Text style={styles.uploadText}>Click to upload{'\n'}MP4, MOV (max 100MB)</Text>
              </View>
            )}
          </View>
        </Card>

        <Card style={styles.formCard}>
          <View style={styles.field}><Label>Video Title</Label><Input placeholder="Enter video title" /></View>
          <View style={styles.field}><Label>Caption</Label><Textarea value={caption} onChangeText={setCaption} placeholder="Describe your performance..." /></View>
          <View style={styles.field}><Label>Tags</Label><Input placeholder="e.g., Jazz, Live Performance" /></View>
          <View style={styles.actions}>
            <Button variant="outline" style={styles.actionBtn} onPress={() => navigate('artist-dashboard')}><Text style={styles.actionText}>Cancel</Text></Button>
            <Button style={[styles.actionBtn, styles.primaryBtn]} onPress={handleUpload}><Upload size={20} color="#fff" /><Text style={styles.actionText}>Upload Video</Text></Button>
          </View>
        </Card>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 24 },
  previewCard: { padding: 24, marginBottom: 24 },
  previewBox: { aspectRatio: 9/16, maxHeight: 400, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: 'rgba(255,255,255,0.6)' },
  playBtn: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  uploadArea: { alignItems: 'center' },
  uploadText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 16 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24 },
  field: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  actionText: { color: '#fff' },
});
