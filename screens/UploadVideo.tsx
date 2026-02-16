import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Pressable, Image } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Upload, Play, X, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth-context';

interface Props { navigate: (screen: string) => void; }

export default function UploadVideo({ navigate }: Props) {
  const { appUser } = useAuth();
  const [previewUrl, setPreviewUrl] = useState('');
  const [videoFile, setVideoFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState('');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [tags, setTags] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const generateThumbnail = async (videoUri: string) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,
      });
      setThumbnailUri(uri);
    } catch (e) {
      console.warn("Could not generate thumbnail", e);
    }
  };

  const pickVideo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Videos,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled) {
        const asset = result.assets[0];
        setVideoFile(asset);
        setPreviewUrl(asset.uri);
        // Auto-generate thumbnail
        generateThumbnail(asset.uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const pickThumbnail = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
    }
  };

  const uploadFile = async (uri: string, folder: string) => {
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 1000)}.${fileExt}`;
    // Restoring user_id folder for both 'videos' and 'thumbnails'
    const filePath = `${appUser.id}/${fileName}`;

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
      .from(folder)
      .upload(filePath, fileData, {
        contentType: folder === 'videos' ? (videoFile?.mimeType ?? 'video/mp4') : 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(folder)
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleUpload = async () => {
    if (!videoFile || !title) {
      Alert.alert('Error', 'Please select a video and enter a title.');
      return;
    }

    if (!appUser) {
      Alert.alert('Error', 'You must be logged in to upload videos.');
      return;
    }

    setIsUploading(true);
    try {
      // Upload Video
      const videoPublicUrl = await uploadFile(videoFile.uri, 'videos');

      // Upload Thumbnail (if exists)
      let thumbnailPublicUrl = null;
      if (thumbnailUri) {
        // We'll upload thumbnail to 'thumbnails' bucket as requested.
        thumbnailPublicUrl = await uploadFile(thumbnailUri, 'thumbnails');
      }

      // Insert into Database
      const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          artist_id: appUser.id,
          video_url: videoPublicUrl,
          thumbnail_url: thumbnailPublicUrl,
          title: title,
          tags: tagArray,
          upload_date: new Date().toISOString(),
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Video uploaded successfully!');
      navigate('artist-dashboard');
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Button variant="ghost" size="icon" onPress={() => navigate('artist-dashboard')} disabled={isUploading}>
            <ChevronLeft size={24} color="#fff" />
          </Button>
          <Text style={styles.title}>Upload Video</Text>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.content}>
              <Card style={styles.previewCard}>
                <Pressable onPress={pickVideo} disabled={isUploading}>
                  <View style={styles.previewBox}>
                    {previewUrl ? (
                      <>
                        <Image source={{ uri: thumbnailUri || previewUrl }} style={styles.thumbnailImage} resizeMode="cover" />
                        <View style={styles.playBtn}><Play size={32} color="#fff" /></View>
                        <Button variant="ghost" size="icon" style={styles.removeBtn} onPress={() => { setPreviewUrl(''); setVideoFile(null); setThumbnailUri(''); }} disabled={isUploading}>
                          <X size={20} color="#fff" />
                        </Button>
                      </>
                    ) : (
                      <View style={styles.uploadArea}>
                        <Upload size={64} color="rgba(255,255,255,0.4)" />
                        <Text style={styles.uploadText}>Click to upload{'\n'}MP4, MOV</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
                {previewUrl && (
                  <Button variant="outline" onPress={pickThumbnail} style={styles.thumbnailBtn} disabled={isUploading}>
                    <ImageIcon size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.actionText}>Change Thumbnail</Text>
                  </Button>
                )}
              </Card>

              <Card style={styles.formCard}>
                <View style={styles.field}><Label>Video Title</Label><Input placeholder="Enter video title" value={title} onChangeText={setTitle} editable={!isUploading} /></View>
                <View style={styles.field}><Label>Caption</Label><Textarea value={caption} onChangeText={setCaption} placeholder="Describe your performance..." editable={!isUploading} /></View>
                <View style={styles.field}><Label>Tags</Label><Input placeholder="e.g., Jazz, Live Performance" value={tags} onChangeText={setTags} editable={!isUploading} /></View>
                <View style={styles.actions}>
                  <Button variant="outline" style={styles.actionBtn} onPress={() => navigate('artist-dashboard')} disabled={isUploading}><Text style={styles.actionText}>Cancel</Text></Button>
                  <Button style={[styles.actionBtn, styles.primaryBtn]} onPress={handleUpload} disabled={isUploading}>
                    {isUploading ? <ActivityIndicator color="#fff" /> : <><Upload size={20} color="#fff" /><Text style={styles.actionText}>Upload Video</Text></>}
                  </Button>
                </View>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { padding: 24 },
  previewCard: { padding: 24, marginBottom: 24 },
  previewBox: { aspectRatio: 9 / 16, maxHeight: 400, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  thumbnailImage: { width: '100%', height: '100%', position: 'absolute' },
  placeholderText: { color: 'rgba(255,255,255,0.6)' },
  playBtn: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  removeBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 10 },
  thumbnailBtn: { marginTop: 12 },
  uploadArea: { alignItems: 'center' },
  uploadText: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 16 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 24 },
  field: { marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  actionBtn: { flex: 1 },
  primaryBtn: { backgroundColor: '#a855f7' },
  actionText: { color: '#fff' },
});
