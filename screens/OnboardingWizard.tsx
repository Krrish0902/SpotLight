import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Animated, Dimensions, Pressable, KeyboardAvoidingView, Platform, TextInput, StatusBar, Image } from 'react-native';
import { Text } from '../components/ui/Text';
import { ChevronRight, ChevronLeft, Music, Briefcase, Camera, CheckCircle2, Globe, Music2, Guitar } from 'lucide-react-native';
import { useAuth, UserRole } from '../lib/auth-context';
import { MultiSelectWithCustom, POPULAR_GENRES, POPULAR_INSTRUMENTS } from '../components/MultiSelectWithCustom';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { Fab } from '../components/ui/fab';
import { StackHeader } from '../components/ui/stack-header';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

interface Props {
    navigate: (screen: string) => void;
}

export default function OnboardingWizard({ navigate }: Props) {
    const { appUser, profile, updateRole, saveProfile } = useAuth();

    const [step, setStep] = useState(0);
    const slideAnim = useRef(new Animated.Value(0)).current;

    // Form State
    const [role, setRole] = useState<UserRole | null>(null);
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [age, setAge] = useState('');
    const [bio, setBio] = useState('');
    const [instagramUrl, setInstagramUrl] = useState('');
    const [genres, setGenres] = useState<string[]>([]);
    const [instruments, setInstruments] = useState<string[]>([]);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileVideoUrl, setProfileVideoUrl] = useState<string | null>(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        Animated.spring(slideAnim, {
            toValue: -step * width,
            useNativeDriver: true,
            friction: 8,
            tension: 40
        }).start();
    }, [step]);

    const handleNext = () => {
        if (step < 3) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 0) setStep(step - 1);
    };

    const uploadFile = async (uri: string, type: 'avatar' | 'video') => {
        try {
            if (type === 'avatar') setUploadingAvatar(true);
            else setUploadingVideo(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const ext = type === 'avatar' ? 'jpg' : 'mp4';
            const contentType = type === 'avatar' ? 'image/jpeg' : 'video/mp4';
            const bucket = type === 'avatar' ? 'avatars' : 'videos'; // Assuming 'videos' bucket exists or we can reuse one
            const filePath = `${user.id}/${type}_1_1.${ext}`;

            const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
            const fileData = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, fileData, { contentType, upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(filePath);
            const publicUrlWithTime = `${publicUrl}?t=${Date.now()}`;

            if (type === 'avatar') setAvatarUrl(publicUrlWithTime);
            else setProfileVideoUrl(publicUrlWithTime);
        } catch (e) {
            console.error(`Upload error for ${type}:`, e);
        } finally {
            if (type === 'avatar') setUploadingAvatar(false);
            else setUploadingVideo(false);
        }
    };

    const handlePickMedia = async (type: 'avatar' | 'video') => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: type === 'avatar' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });
            if (!result.canceled && result.assets?.length) {
                await uploadFile(result.assets[0].uri, type);
            }
        } catch {
            // ignore
        }
    };

    const completeOnboarding = async () => {
        setLoading(true);
        if (role && role !== appUser?.role) {
            await updateRole(role);
        }
        await saveProfile({
            display_name: displayName || 'New User',
            username: username.toLowerCase().replace(/[^a-z0-9_]/g, '') || undefined,
            age: age ? parseInt(age, 10) : undefined,
            bio: bio.trim() || undefined,
            instagram_url: instagramUrl.trim() || undefined,
            genres: genres.length ? genres : undefined,
            instruments: instruments.length ? instruments : undefined,
            profile_video_url: profileVideoUrl || undefined,
        });
        setLoading(false);
        navigate('public-home');
    };

    const isStepValid = () => {
        if (step === 0) return !!role;
        if (step === 1) return !!displayName && !!username && !!age;
        return true;
    };

    const steps = [
        // Step 0: Welcome / Role Selection
        <View style={{ width, paddingHorizontal: 32, paddingTop: 40 }} key="role">
            <Text className="text-4xl font-playfair-semibold text-black mb-2">Choose your path</Text>
            <Text className="text-base text-neutral-500 font-poppins-regular mb-10">How do you want to use Spotlight?</Text>

            <View className="gap-4">
                <Pressable
                    className={`border rounded-2xl p-6 flex-row items-center gap-4 ${role === 'artist' ? 'border-fuchsia-900 bg-fuchsia-50' : 'border-neutral-200 bg-white'}`}
                    onPress={() => setRole('artist')}
                >
                    <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center">
                        <Music size={28} color={role === 'artist' ? '#4a148c' : '#000'} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-poppins-bold text-black">Artist</Text>
                        <Text className="text-sm font-poppins-regular text-neutral-500 mt-1">Showcase your talent and manage bookings</Text>
                    </View>
                </Pressable>

                <Pressable
                    className={`border rounded-2xl p-6 flex-row items-center gap-4 ${role === 'organizer' ? 'border-fuchsia-900 bg-fuchsia-50' : 'border-neutral-200 bg-white'}`}
                    onPress={() => setRole('organizer')}
                >
                    <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center">
                        <Briefcase size={28} color={role === 'organizer' ? '#4a148c' : '#000'} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xl font-poppins-bold text-black">Organizer</Text>
                        <Text className="text-sm font-poppins-regular text-neutral-500 mt-1">Discover and book creative talent</Text>
                    </View>
                </Pressable>
            </View>
        </View>,

        // Step 1: Basic Info
        <View style={{ width, paddingHorizontal: 32, paddingTop: 40 }} key="identity">
            <Text className="text-4xl font-playfair-semibold text-black mb-2">Let's get to know you</Text>
            <Text className="text-base text-neutral-500 font-poppins-regular mb-10">Set up your public identity.</Text>

            <View className="gap-8">
                <View>
                    <Text className="text-sm font-poppins-semibold text-neutral-500 mb-2">Full Name / Artist Name</Text>
                    <TextInput
                        className="border-b border-neutral-300 h-16 text-3xl font-poppins-medium text-black"
                        selectionColor="#000"
                        value={displayName}
                        onChangeText={setDisplayName}
                        placeholder="E.g. Maya Rivers"
                        autoCapitalize="words"
                        placeholderTextColor="#ccc"
                    />
                </View>
                <View>
                    <Text className="text-sm font-poppins-semibold text-neutral-500 mb-2">Username</Text>
                    <TextInput
                        className="border-b border-neutral-300 h-16 text-3xl font-poppins-medium text-black"
                        selectionColor="#000"
                        value={username}
                        onChangeText={setUsername}
                        placeholder="maya_rivers"
                        autoCapitalize="none"
                        placeholderTextColor="#ccc"
                    />
                </View>
                <View>
                    <Text className="text-sm font-poppins-semibold text-neutral-500 mb-2">Age</Text>
                    <TextInput
                        className="border-b border-neutral-300 h-16 text-3xl font-poppins-medium text-black"
                        selectionColor="#000"
                        value={age}
                        onChangeText={setAge}
                        placeholder="24"
                        keyboardType="numeric"
                        maxLength={3}
                        placeholderTextColor="#ccc"
                    />
                </View>
            </View>
        </View>,

        // Step 2: Media stub
        <View style={{ width, paddingHorizontal: 32, paddingTop: 40 }} key="media">
            <Text className="text-4xl font-playfair-semibold text-black mb-2">Your Digital Identity</Text>
            <Text className="text-base text-neutral-500 font-poppins-regular mb-8">Showcase who you are to the community.</Text>

            <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
                <View className="flex-row justify-between mb-8">
                    <View className="items-center flex-1">
                        <Text className="text-sm font-poppins-semibold text-neutral-500 mb-3">Profile Photo (1:1)</Text>
                        <Pressable 
                            className="w-32 h-32 rounded-3xl bg-neutral-100 border border-dashed border-neutral-300 items-center justify-center overflow-hidden" 
                            onPress={() => handlePickMedia('avatar')} 
                            disabled={uploadingAvatar}
                        >
                            {avatarUrl ? (
                                <Image source={{ uri: avatarUrl }} className="w-full h-full" />
                            ) : (
                                <>
                                    <Camera size={32} color="#ccc" />
                                    <Text className="text-neutral-400 mt-2 font-poppins-regular text-xs">{uploadingAvatar ? 'Uploading...' : 'Add Photo'}</Text>
                                </>
                            )}
                        </Pressable>
                    </View>

                    <View className="items-center flex-1">
                        <Text className="text-sm font-poppins-semibold text-neutral-500 mb-3">Profile Video (1:1)</Text>
                        <Pressable 
                            className="w-32 h-32 rounded-3xl bg-neutral-100 border border-dashed border-neutral-300 items-center justify-center overflow-hidden" 
                            onPress={() => handlePickMedia('video')} 
                            disabled={uploadingVideo}
                        >
                            {profileVideoUrl ? (
                                <View className="w-full h-full bg-black items-center justify-center">
                                    <Text className="text-white text-xs font-poppins-medium">Video Uploaded ✓</Text>
                                </View>
                            ) : (
                                <>
                                    <Camera size={32} color="#ccc" />
                                    <Text className="text-neutral-400 mt-2 font-poppins-regular text-xs text-center px-2">{uploadingVideo ? 'Uploading...' : 'Add Video'}</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>

                <View className="gap-6">
                    <View>
                        <Text className="text-sm font-poppins-semibold text-neutral-500 mb-2">Instagram URL</Text>
                        <View className="flex-row items-center border-b border-neutral-300 h-14">
                            <Globe size={20} color="#ccc" className="mr-2" />
                            <TextInput
                                className="flex-1 text-lg font-poppins-medium text-black h-full"
                                selectionColor="#000"
                                value={instagramUrl}
                                onChangeText={setInstagramUrl}
                                placeholder="instagram.com/maya_rivers"
                                autoCapitalize="none"
                                placeholderTextColor="#ccc"
                            />
                        </View>
                    </View>

                    {role === 'artist' && (
                        <>
                            <View className="mt-2">
                                <MultiSelectWithCustom
                                    label="Primary Genres"
                                    options={POPULAR_GENRES}
                                    value={genres}
                                    onChange={setGenres}
                                    placeholder="Select your genres"
                                    leftIcon={<Music2 size={20} color="rgba(255,255,255,0.4)" />}
                                />
                            </View>
                            <View className="mt-4">
                                <Text className="text-sm font-poppins-semibold text-neutral-500 mb-2">Bio / Vibe</Text>
                                <TextInput
                                    className="border border-neutral-300 rounded-xl p-4 text-black font-poppins-regular text-base"
                                    multiline
                                    numberOfLines={4}
                                    style={{ height: 120, textAlignVertical: 'top' }}
                                    placeholder="Tell us what makes your events or music unique..."
                                    value={bio}
                                    onChangeText={setBio}
                                    placeholderTextColor="#ccc"
                                />
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </View>,

        // Step 3: Final
        <View style={{ width, paddingHorizontal: 32, paddingTop: 40 }} key="finish">
            <View className="flex-1 items-center justify-center -mt-20">
                <CheckCircle2 size={72} color="#4a148c" style={{ marginBottom: 24 }} />
                <Text className="text-4xl font-playfair-semibold text-black mb-2 text-center">You're all set!</Text>
                <Text className="text-base text-neutral-500 font-poppins-regular text-center">Your profile is ready. Let's start exploring.</Text>
            </View>
        </View>
    ];

    return (
        <View className="flex-1 bg-white">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <StatusBar barStyle="dark-content" />

                <StackHeader 
                    onBack={step > 0 ? handleBack : undefined} 
                    showBack={step > 0} 
                />

                {/* Progress bar */}
                <View className="flex-row gap-2 justify-center px-4 mb-4">
                    {steps.map((_, i) => (
                        <View 
                            key={i} 
                            className={`h-2 rounded-full ${i <= step ? 'bg-fuchsia-900 w-6' : 'bg-neutral-200 w-2'}`} 
                        />
                    ))}
                </View>

                <Animated.View style={[{ flex: 1, flexDirection: 'row', width: width * 4 }, { transform: [{ translateX: slideAnim }] }]}>
                    {steps}
                </Animated.View>

                {/* Footer Navigation */}
                <View className="p-6 pb-10 items-end">
                    {step < steps.length - 1 ? (
                        <Fab 
                            disabled={!isStepValid()} 
                            onPress={handleNext} 
                            iconName="chevron-forward"
                        />
                    ) : (
                        <Fab 
                            disabled={loading} 
                            onPress={completeOnboarding} 
                            loading={loading}
                            iconName="checkmark"
                        />
                    )}
                </View>

            </KeyboardAvoidingView>
        </View>
    );
}
