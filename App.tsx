import React, { useState, useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, ActivityIndicator, BackHandler, Platform, PanResponder } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PostHogProvider } from 'posthog-react-native';
import { posthog } from './lib/posthog';

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
import CreateEventScreen from './screens/CreateEventScreen';
import EventsGridScreen from './screens/EventsGridScreen';
import ChatHub from './screens/ChatHub';

export type { UserRole };

export interface AppState {
  currentScreen: string;
  userRole: UserRole;
  selectedArtist?: any;
  selectedEvent?: any;
  eventId?: string;
  returnTo?: string;
  chatId?: string;
}

type NavState = { current: AppState; history: AppState[] };

function AppContent() {
  const { appUser, profile, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [navState, setNavState] = useState<NavState>({
    current: {
      currentScreen: 'public-home',
      userRole: appUser?.role ?? 'public',
      selectedArtist: undefined,
      selectedEvent: undefined,
    },
    history: [],
  });

  const appState = navState.current;
  const userRole = appUser?.role ?? appState.userRole;
  const isAuthenticated = !!appUser;
  const historyLengthRef = useRef(0);
  historyLengthRef.current = navState.history.length;

  const popHistory = () => {
    if (historyLengthRef.current === 0) return;
    setNavState(prev => {
      if (prev.history.length === 0) return prev;
      return {
        history: prev.history.slice(0, -1),
        current: prev.history[prev.history.length - 1],
      };
    });
  };

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (appUser?.role) {
      setNavState(prev => ({
        ...prev,
        current: { ...prev.current, userRole: appUser.role },
      }));
    }
  }, [appUser?.role]);

  // Android back button: go to previous in-app screen instead of exiting
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (historyLengthRef.current > 0) {
        popHistory();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, []);

  const iosEdgeSwipeResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (_evt, gestureState) =>
        Platform.OS === 'ios' && historyLengthRef.current > 0 && gestureState.x0 <= 24,
      onMoveShouldSetPanResponder: (_evt, gestureState) =>
        Platform.OS === 'ios' &&
        historyLengthRef.current > 0 &&
        gestureState.x0 <= 24 &&
        gestureState.dx > 8 &&
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_evt, gestureState) => {
        if (
          Platform.OS === 'ios' &&
          historyLengthRef.current > 0 &&
          gestureState.x0 <= 24 &&
          gestureState.dx > 90 &&
          gestureState.vx > 0.2
        ) {
          popHistory();
        }
      },
    })
  ).current;

  const navigate = (screen: string, data?: any) => {
    setNavState(prev => ({
      history: [...prev.history, prev.current],
      current: { ...prev.current, currentScreen: screen, ...(data || {}) },
    }));
  };

  const setRole = (role: UserRole) => {
    setNavState(prev => ({
      ...prev,
      current: { ...prev.current, userRole: role },
    }));
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
      case 'public-home':
        return <PublicHome navigate={navigate} />;
      case 'search-discover':
        return <SearchDiscover navigate={navigate} />;
      case 'event-details':
        return <EventDetails navigate={navigate} event={appState.selectedEvent} eventId={appState.eventId} />;
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
      case 'messaging':
        return <Messaging navigate={navigate} artist={appState.selectedArtist} chatId={appState.chatId} />;
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
      case 'chat-hub':
        return <ChatHub navigate={navigate} />;
      default:
        return <PublicHome navigate={navigate} />;
    }
  };

  return (
    <View style={styles.screen} {...(Platform.OS === 'ios' ? iosEdgeSwipeResponder.panHandlers : {})}>
      {renderScreen()}
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <PostHogProvider client={posthog}>
          <AuthProvider>
            <StatusBar style="light" />
            <AppContent />
          </AuthProvider>
        </PostHogProvider>
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
