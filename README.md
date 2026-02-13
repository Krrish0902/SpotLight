# ArtistHub - React Native App

A React Native (Expo) conversion of the Artist Discovery Booking App, designed to look **exactly like** the original web app.

## Features

- **Splash Screen** - Animated logo with gradient background
- **Public Home** - Artist discovery with like, profile, and share actions
- **Search & Discover** - Browse artists with filters
- **Event Details** - View events and lineup
- **Login/Signup** - Tabbed auth with social options
- **Role Selection** - Choose Artist or Organizer path
- **Profile Setup** - Complete your profile
- **Artist Dashboard** - Stats, quick actions, recent activity
- **Artist Profile** - Videos, availability, reviews
- **Upload Video** - Add performance videos
- **Manage Availability** - Set booking dates
- **Submit to Contest** - Enter competitions
- **Purchase Boost** - Profile visibility packages
- **Payment** - Checkout flow
- **Organizer Dashboard** - Booking requests, saved artists
- **Request Booking** - Send booking requests
- **Messaging** - Chat with artists
- **Admin Dashboard** - Platform stats and management
- **Moderate Content** - Review videos
- **Approve Boost** - Review boost requests
- **Manage Contests** - Create and manage contests
- **Manage Live Events** - Event management
- **Manage Profiles** - User management

## Run the App

```bash
cd ArtistHubApp
npm install
npx expo start
```

Then:
- Press `a` for Android
- Press `i` for iOS (requires Mac)
- Press `w` for web
- Scan QR code with Expo Go app on your phone

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **expo-linear-gradient** - Gradient backgrounds
- **lucide-react-native** - Icons (same as web)
- **react-native-reanimated** - Splash animations
- **react-native-safe-area-context** - Safe areas

## Navigation

Uses the same state-based navigation as the web app. Tap through screens to explore all flows. Use "Admin Access" on the Role Selection screen to test admin features.
