import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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

export type UserRole = 'public' | 'artist' | 'organizer' | 'admin';

export interface AppState {
  currentScreen: string;
  userRole: UserRole;
  isAuthenticated: boolean;
  selectedArtist?: any;
  selectedEvent?: any;
}

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [appState, setAppState] = useState<AppState>({
    currentScreen: 'public-home',
    userRole: 'public',
    isAuthenticated: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  const navigate = (screen: string, data?: any) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      ...(data || {}),
    }));
  };

  const setRole = (role: UserRole) => {
    setAppState(prev => ({
      ...prev,
      userRole: role,
      isAuthenticated: true,
    }));
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  const renderScreen = () => {
    switch (appState.currentScreen) {
      case 'public-home':
        return <PublicHome navigate={navigate} />;
      case 'search-discover':
        return <SearchDiscover navigate={navigate} />;
      case 'event-details':
        return <EventDetails navigate={navigate} event={appState.selectedEvent} />;
      case 'login-signup':
        return <LoginSignup navigate={navigate} />;
      case 'role-selection':
        return <RoleSelection navigate={navigate} setRole={setRole} />;
      case 'profile-setup':
        return <ProfileSetup navigate={navigate} userRole={appState.userRole} />;
      case 'artist-dashboard':
        return <ArtistDashboard navigate={navigate} />;
      case 'artist-profile':
        return <ArtistProfile navigate={navigate} artist={appState.selectedArtist} userRole={appState.userRole} />;
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
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.screen}>{renderScreen()}</View>
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
});

export default App;
