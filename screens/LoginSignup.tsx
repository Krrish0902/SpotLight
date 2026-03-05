import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Pressable, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../lib/auth-context';
import { colors } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  navigate: (screen: string, data?: any) => void;
  returnTo?: string;
  defaultTab?: 'login' | 'signup';
}

export default function LoginSignup({ navigate, returnTo = 'onboarding-start', defaultTab = 'login' }: Props) {
  const insets = useSafeAreaInsets();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(defaultTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (mode === 'signup' && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await signIn(email.trim(), password);
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    } else {
      const { error: err } = await signUp(email.trim(), password, 'public');
      setLoading(false);
      if (err) {
        setError(err.message);
        return;
      }
    }
    // App.tsx auth watcher will handle routing after successful auth
  };

  const toggleMode = () => {
    setError(null);
    setMode(prev => prev === 'login' ? 'signup' : 'login');
  };

  const isLogin = mode === 'login';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => navigate(returnTo)} style={styles.backBtn}>
          <ChevronLeft size={28} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Title */}
        <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue discovering artists.' : 'Join SpotLight and discover amazing artists.'}
        </Text>

        {/* Error */}
        {error ? (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Email field */}
        <View style={styles.field}>
          <Label style={styles.label}>Email</Label>
          <Input
            leftIcon={<Mail size={20} color="rgba(0,0,0,0.4)" />}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password field */}
        <View style={styles.field}>
          <Label style={styles.label}>Password</Label>
          <Input
            leftIcon={<Lock size={20} color="rgba(0,0,0,0.4)" />}
            value={password}
            onChangeText={setPassword}
            placeholder={isLogin ? 'Enter your password' : 'Create a password (min 6 chars)'}
            secureTextEntry
          />
        </View>

        {/* Submit button */}
        <Pressable
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          )}
        </Pressable>

        {/* Forgot Password (login only) */}
        {isLogin && (
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
        )}

        {/* Toggle mode link */}
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
          </Text>
          <Pressable onPress={toggleMode}>
            <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  errorWrap: {
    padding: 14,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red[400],
    marginBottom: 20,
  },
  errorText: {
    color: colors.red[400],
    fontSize: 14,
  },
  label: {
    color: '#444',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  field: {
    marginBottom: 20,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  forgotBtn: {
    alignItems: 'center',
    marginBottom: 16,
  },
  forgotText: {
    color: '#C8A2C8',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 40,
  },
  toggleLabel: {
    color: '#888',
    fontSize: 15,
  },
  toggleLink: {
    color: '#C8A2C8',
    fontSize: 15,
    fontWeight: '700',
  },
});
