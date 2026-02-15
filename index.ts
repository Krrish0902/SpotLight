import 'react-native-url-polyfill/auto';
import { Platform, Text, TextInput } from 'react-native';
import { registerRootComponent } from 'expo';

import App from './App';

// Fix Android font clipping – disable extra padding that cuts off glyphs
if (Platform.OS === 'android') {
  Text.defaultProps = Text.defaultProps || {};
  (Text.defaultProps as any).includeFontPadding = false;
  TextInput.defaultProps = TextInput.defaultProps || {};
  (TextInput.defaultProps as any).includeFontPadding = false;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
