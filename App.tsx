import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
import AdminDashboard from './screens/AdminDashboard';
import ModerateContent from './screens/ModerateContent';
import ApproveBoost from './screens/ApproveBoost';
import ManageContests from './screens/ManageContests';
import ManageLiveEvents from './screens/ManageLiveEvents';
import ManageProfiles from './screens/ManageProfiles';

export type { UserRole };

export interface AppState {
  currentScreen: string;
  userRole: UserRole;
  selectedArtist?: any;
  selectedEvent?: any;
}

function AppContent() {
  const { appUser, profile, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'public-home',
    userRole: appUser?.role ?? 'public',
    selectedArtist: undefined,
    selectedEvent: undefined,
  });

  const userRole = appUser?.role ?? appState.userRole;
  const isAuthenticated = !!appUser;

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (appUser?.role) {
      setAppState(prev => ({ ...prev, userRole: appUser.role }));
    }
  }, [appUser?.role]);

  // Redirect logged-in artist/organizer from public-home to dashboard (profile-setup only on signup)
  useEffect(() => {
    if (isLoading || !appUser || appState.currentScreen !== 'public-home') return;
    if (appUser.role === 'artist' || appUser.role === 'organizer') {
      const target = appUser.role === 'artist' ? 'artist-dashboard' : 'organizer-dashboard';
      setAppState(prev => ({ ...prev, currentScreen: target, userRole: appUser.role }));
    }
  }, [appUser, isLoading, appState.currentScreen]);

  // Avoid "pop" by rendering target screen directly when we would redirect from public-home
  const effectiveScreen = (() => {
    if (appState.currentScreen !== 'public-home' || isLoading || !appUser) return appState.currentScreen;
    if (appUser.role === 'artist' || appUser.role === 'organizer') {
      return appUser.role === 'artist' ? 'artist-dashboard' : 'organizer-dashboard';
    }
    return appState.currentScreen;
  })();

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
    switch (effectiveScreen) {
      case 'public-home':
        return <PublicHome navigate={navigate} />;
      case 'search-discover':
        return <SearchDiscover navigate={navigate} />;
      case 'event-details':
        return <EventDetails navigate={navigate} event={appState.selectedEvent} />;
      case 'login-signup':
        return <LoginSignup navigate={navigate} returnTo={appState.returnTo ?? 'public-home'} />;
      case 'role-selection':
        return <RoleSelection navigate={navigate} setRole={setRole} />;
      case 'profile-setup':
        return <ProfileSetup navigate={navigate} userRole={userRole} />;
      case 'edit-profile':
        return <ProfileSetup navigate={navigate} userRole={userRole} mode="edit" returnTo="artist-profile" />;
      case 'artist-dashboard':
        return <ArtistDashboard navigate={navigate} />;
      case 'artist-profile':
        return <ArtistProfile navigate={navigate} artist={appState.selectedArtist} userRole={userRole} />;
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
      case 'organizer-dashboard':
        return <OrganizerDashboard navigate={navigate} />;
      case 'request-booking':
        return <RequestBooking navigate={navigate} artist={appState.selectedArtist} />;
      case 'messaging':
        return <Messaging navigate={navigate} artist={appState.selectedArtist} />;
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
      default:
        return <PublicHome navigate={navigate} />;
    }
  };

  return (
    <View style={styles.screen}>{renderScreen()}</View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="light" />
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
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
