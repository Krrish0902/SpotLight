import React from 'react';
import { View, Text, Pressable, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StackHeader } from '../components/ui/stack-header';
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const createSessionFromUrl = async (url: string) => {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) throw new Error(errorCode);
  const { access_token, refresh_token } = params;
  if (!access_token) return;

  const { data, error } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });
  if (error) throw error;
  return data.session;
};

interface Props {
  navigate: (screen: string, data?: any) => void;
  mode: 'signin' | 'signup';
}

export default function AuthOptions({ navigate, mode }: Props) {
  const performOAuth = async (provider: "google" | "apple") => {
    try {
      const redirectUri = makeRedirectUri({ scheme: "artist" });
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: redirectUri },
      });

      if (error) throw error;
      if (data?.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        if (result.type === "success") {
          await createSessionFromUrl(result.url);
        }
      }
    } catch (err: any) {
      console.error(`OAuth error (${provider}):`, err);
    }
  };

  const title = mode === 'signup' ? 'Create Account' : 'Sign In';
  const subtitle = mode === 'signup' 
    ? 'Join Spotlight to discover, book, and perform.' 
    : 'Welcome back to Spotlight.';

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />
      <StackHeader onBack={() => navigate('onboarding-start')} />
      
      <SafeAreaView className="flex-1 px-8 pt-4 pb-12" edges={['bottom']}>
        <View className="flex-1">
          <Text className="text-4xl font-playfair-semibold text-black mb-2">{title}</Text>
          <Text className="text-base font-poppins-regular text-neutral-500 mb-12">{subtitle}</Text>

          <View className="gap-4">
            <Pressable
              onPress={() => performOAuth("apple")}
              className="bg-black h-14 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="logo-apple" size={24} color="white" style={{ position: 'absolute', left: 24 }} />
              <Text className="text-white text-lg font-poppins-semibold">Continue with Apple</Text>
            </Pressable>

            <Pressable
              onPress={() => performOAuth("google")}
              className="bg-white border border-neutral-300 h-14 flex-row items-center justify-center rounded-2xl"
            >
              <Ionicons name="logo-google" size={24} color="black" style={{ position: 'absolute', left: 24 }} />
              <Text className="text-black text-lg font-poppins-semibold">Continue with Google</Text>
            </Pressable>

            <View className="flex-row items-center my-4">
              <View className="flex-1 h-[1px] bg-neutral-200" />
              <Text className="mx-4 text-neutral-400 font-poppins-regular">or</Text>
              <View className="flex-1 h-[1px] bg-neutral-200" />
            </View>

            <Pressable 
              onPress={() => navigate('phone-auth', { returnTo: 'auth-options', mode })}
              className="bg-fuchsia-900 h-14 items-center justify-center rounded-2xl"
            >
              <Ionicons name="call" size={22} color="white" style={{ position: 'absolute', left: 24 }} />
              <Text className="text-white text-lg font-poppins-semibold">Use Phone Number</Text>
            </Pressable>
            
            <Pressable 
              onPress={() => navigate('login-signup')}
              className="bg-white border border-neutral-300 h-14 items-center justify-center rounded-2xl"
            >
              <Ionicons name="mail" size={22} color="black" style={{ position: 'absolute', left: 24 }} />
              <Text className="text-black text-lg font-poppins-semibold">Use Email Support</Text>
            </Pressable>
          </View>
        </View>

        <Text className="text-neutral-400 text-xs font-poppins-regular text-center mt-auto">
          By continuing, you agree to our <Text className="underline">Terms of Service</Text> and <Text className="underline">Privacy Policy</Text>.
        </Text>
      </SafeAreaView>
    </View>
  );
}
