import 'react-native-url-polyfill/auto';
import { Platform, Text, TextInput } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Android font clipping mitigation is now handled on the component level where possible.

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
