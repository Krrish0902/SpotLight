import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Mail, Lock } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';
import { useAuth } from '../lib/auth-context';
import { colors } from '../theme';

interface Props {
  navigate: (screen: string) => void;
  returnTo?: string;
}

export default function LoginSignup({ navigate, returnTo = 'public-home' }: Props) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    const { error: err } = await signIn(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('role-selection');
  };

  const handleSignUp = async () => {
    setError(null);
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error: err } = await signUp(email.trim(), password, 'public');
    if (!err) {
      const { posthog } = require('../lib/posthog');
      posthog.capture('user_signed_up');
    }
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('role-selection');
  };

  return (
    <LinearGradient colors={['#050A18', '#070B1A', '#050A18']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate(returnTo)}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>SpotLight</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Welcome Back</Text>
            <Text style={styles.heroSubtitle}>Sign in or create an account to continue.</Text>
          </View>
          <Tabs
            defaultValue="login"
            fullWidth
            tabs={[
              { value: 'login', label: 'Login' },
              { value: 'signup', label: 'Sign Up' },
            ]}
            onValueChange={() => setError(null)}
          >
            {(activeTab) => (
              <View style={styles.form}>
                {error ? (
                  <View style={styles.errorWrap}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}
                <View style={styles.field}>
                  <Label>Email</Label>
                  <Input
                    leftIcon={<Mail size={20} color="rgba(255,255,255,0.4)" />}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.field}>
                  <Label>Password</Label>
                  <Input
                    leftIcon={<Lock size={20} color="rgba(255,255,255,0.4)" />}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={activeTab === 'login' ? 'Enter your password' : 'Create a password (min 6 chars)'}
                    secureTextEntry
                  />
                </View>
                {activeTab === 'login' ? (
                  <>
                    <Button
                      onPress={handleLogin}
                      style={styles.gradientBtn}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.btnText}>Login</Text>
                      )}
                    </Button>
                    <Button variant="ghost" onPress={() => {}}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Button>
                  </>
                ) : (
                  <Button
                    onPress={handleSignUp}
                    style={styles.gradientBtn}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Create Account</Text>
                    )}
                  </Button>
                )}
              </View>
            )}
          </Tabs>

        </Card>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 32,
    padding: 24,
    ...(Platform.OS === 'web'
      ? ({
          maxWidth: 460,
          width: '100%',
          alignSelf: 'center',
          boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
        } as any)
      : {}),
  },
  hero: {
    marginBottom: 16,
    alignItems: 'center',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.62)',
    fontSize: 14,
    marginTop: 6,
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  errorWrap: {
    padding: 12,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.red[400],
  },
  errorText: {
    color: colors.red[400],
    fontSize: 14,
  },
  field: {
    marginBottom: 4,
  },
  gradientBtn: {
    backgroundColor: '#FDF2FF',
    marginTop: 10,
    borderRadius: 100,
    minHeight: 52,
  },
  btnText: {
    color: '#162447',
    fontSize: 16,
    fontWeight: '800',
  },
  forgotText: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 14,
    textAlign: 'center',
  },
});
