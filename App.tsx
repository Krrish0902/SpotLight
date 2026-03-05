import './global.css';
import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SendbirdUIKitContainer } from '@sendbird/uikit-react-native';
import { LightUIKitTheme, createTheme } from '@sendbird/uikit-react-native-foundation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { platformServices } from './lib/sendbird';

import { AuthProvider, useAuth, UserRole } from './lib/auth-context';
import SplashScreen from './screens/SplashScreen';
import PublicHome from './screens/PublicHome';
import SearchDiscover from './screens/SearchDiscover';
import EventDetails from './screens/EventDetails';
import LoginSignup from './screens/LoginSignup';
import RoleSelection from './screens/RoleSelection';
import ProfileSetup from './screens/ProfileSetup';
import ArtistDashboard from './screens/ArtistDashboard';
import ArtistProfile from './screens/ArtistProfile';
import UploadVideo from './screens/UploadVideo';
import ManageAvailability from './screens/ManageAvailability';
import SubmitToContest from './screens/SubmitToContest';
import PurchaseBoost from './screens/PurchaseBoost';
import PaymentScreen from './screens/PaymentScreen';
import OrganizerDashboard from './screens/OrganizerDashboard';
import RequestBooking from './screens/RequestBooking';
import Messaging from './screens/Messaging';
import Matches from './screens/Matches';
import AdminDashboard from './screens/AdminDashboard';
import ModerateContent from './screens/ModerateContent';
import ApproveBoost from './screens/ApproveBoost';
import ManageContests from './screens/ManageContests';
import ManageLiveEvents from './screens/ManageLiveEvents';
import ManageProfiles from './screens/ManageProfiles';
import CreateEventScreen from './screens/CreateEventScreen';
import EventsGridScreen from './screens/EventsGridScreen';

import OnboardingWizard from './screens/OnboardingWizard';
import OnboardingStart from './screens/OnboardingStart';
import AuthOptions from './screens/AuthOptions';
import PhoneAuthScreen from './screens/PhoneAuthScreen';
import OtpScreen from './screens/OtpScreen';
import SettingsScreen from './screens/SettingsScreen';
import PreferencesScreen from './screens/PreferencesScreen';

export type { UserRole };

export interface AppState {
  currentScreen: string;
  userRole: UserRole;
  selectedArtist?: any;
  selectedEvent?: any;
  eventId?: string;
  returnTo?: string;
}

function AppContent() {
  const { appUser, profile, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  const isAuthenticated = !!appUser;

  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'onboarding-start', // Default to onboarding start for Hinge style
    userRole: appUser?.role ?? 'public',
    selectedArtist: undefined,
    selectedEvent: undefined,
  });

  const userRole = appUser?.role ?? appState.userRole;

  // Sync screen on auth state changes
  useEffect(() => {
    if (isLoading) return;

    if (isAuthenticated) {
      // User just logged in or was already logged in
      if (!profile) {
        // No profile row yet — needs to complete profile wizard
        setAppState(prev => ({ ...prev, currentScreen: 'onboarding-wizard' }));
      } else if (appState.currentScreen === 'onboarding-start' || appState.currentScreen === 'login-signup') {
        // Was on auth screens, now logged in → go home
        setAppState(prev => ({ ...prev, currentScreen: 'public-home' }));
      }
    }
    // If not authenticated, don't force redirect — let the user stay on 
    // onboarding-start or login-signup naturally.
  }, [isLoading, isAuthenticated, profile]);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShowSplash(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  useEffect(() => {
    if (appUser?.role) {
      setAppState(prev => ({ ...prev, userRole: appUser.role }));
    }
  }, [appUser?.role]);

  const navigate = (screen: string, data?: any) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      ...(data || {}),
    }));
  };

  const setRole = (role: UserRole) => {
    setAppState(prev => ({ ...prev, userRole: role }));
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#a855f7" />
      </View>
    );
  }

  const renderScreen = () => {
    switch (appState.currentScreen) {
      case 'onboarding-start':
        return <OnboardingStart navigate={navigate} />;
      case 'onboarding-wizard':
        return <OnboardingWizard navigate={navigate} />;
      case 'auth-options':
        return <AuthOptions navigate={navigate} mode={(appState as any).mode || 'signup'} />;
      case 'phone-auth':
        return <PhoneAuthScreen navigate={navigate} returnTo={appState.returnTo} />;
      case 'otp-auth':
        return <OtpScreen navigate={navigate} phone={(appState as any).phone} returnTo={appState.returnTo} />;
      case 'public-home':
        return <PublicHome navigate={navigate} />;
      case 'search-discover':
        return <SearchDiscover navigate={navigate} />;
      case 'event-details':
        return <EventDetails navigate={navigate} event={appState.selectedEvent} eventId={appState.eventId} />;
      case 'login-signup':
        // Pass any dynamic props (like defaultTab) from AppState data if they exist
        return <LoginSignup navigate={navigate} returnTo={appState.returnTo ?? 'public-home'} defaultTab={(appState as any).defaultTab} />;
      case 'role-selection':
        return <RoleSelection navigate={navigate} setRole={setRole} />;
      case 'profile-setup':
        return <ProfileSetup navigate={navigate} userRole={userRole} />;
      case 'edit-profile':
        return <ProfileSetup navigate={navigate} userRole={userRole} mode="edit" returnTo="artist-profile" />;
      case 'artist-dashboard':
        return <ArtistDashboard navigate={navigate} />;
      case 'artist-profile':
        return <ArtistProfile navigate={navigate} artist={appState.selectedArtist} userRole={userRole} returnTo={appState.returnTo} />;
      case 'upload-video':
        return <UploadVideo navigate={navigate} />;
      case 'manage-availability':
        return <ManageAvailability navigate={navigate} />;
      case 'submit-to-contest':
        return <SubmitToContest navigate={navigate} />;
      case 'purchase-boost':
        return <PurchaseBoost navigate={navigate} />;
      case 'payment':
        return <PaymentScreen navigate={navigate} />;
      case 'create-event':
        return <CreateEventScreen navigate={navigate} route={{ params: appState }} />;
      case 'events-grid':
        return <EventsGridScreen navigate={navigate} />;
      case 'organizer-dashboard':
        return <OrganizerDashboard navigate={navigate} />;
      case 'request-booking':
        return <RequestBooking navigate={navigate} artist={appState.selectedArtist} />;
      case 'matches':
        return <Matches navigate={navigate} />;
      case 'messaging':
        return <Messaging navigate={navigate} artist={appState.selectedArtist} channelUrl={(appState as any).channelUrl} />;
      case 'admin-dashboard':
        return <AdminDashboard navigate={navigate} />;
      case 'moderate-content':
        return <ModerateContent navigate={navigate} />;
      case 'approve-boost':
        return <ApproveBoost navigate={navigate} />;
      case 'manage-contests':
        return <ManageContests navigate={navigate} />;
      case 'manage-live-events':
        return <ManageLiveEvents navigate={navigate} />;
      case 'manage-profiles':
        return <ManageProfiles navigate={navigate} />;
      case 'settings':
        return <SettingsScreen navigate={navigate} />;
      case 'preferences':
        return <PreferencesScreen navigate={navigate} />;
      default:
        return <PublicHome navigate={navigate} />;
    }
  };

  return (
    <View style={styles.screen}>{renderScreen()}</View>
  );
}

export default function App() {
  const hingeTheme = createTheme({
    colorScheme: 'light',
    colors: (palette) => ({
      ...LightUIKitTheme.colors,
      primary: '#752968', // Hinge Purplish color
      secondary: '#C8A2C8',
    }),
  });

  return (
    <SendbirdUIKitContainer
      appId={process.env.EXPO_PUBLIC_SENDBIRD_APP_ID!}
      chatOptions={{ localCacheStorage: AsyncStorage }}
      platformServices={platformServices}
      styles={{ theme: hingeTheme }}
    >
      <GestureHandlerRootView style={styles.container}>
        <SafeAreaProvider>
          <AuthProvider>
            <StatusBar style="light" />
            <AppContent />
          </AuthProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </SendbirdUIKitContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  screen: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
