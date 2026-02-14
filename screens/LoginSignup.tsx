import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
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
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    navigate('role-selection');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate(returnTo)}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Welcome to Spotlight</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Tabs
            defaultValue="login"
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

          <View style={styles.socialSection}>
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
            <View style={styles.socialButtons}>
              <Button variant="outline" style={styles.socialBtn} disabled>
                <Text style={styles.socialBtnText}>Google</Text>
              </Button>
              <Button variant="outline" style={styles.socialBtn} disabled>
                <Text style={styles.socialBtnText}>Apple</Text>
              </Button>
            </View>
          </View>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: 'rgba(17,24,39,0.5)',
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 24,
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
    backgroundColor: '#a855f7',
    marginTop: 8,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
  forgotText: {
    color: '#c084fc',
    fontSize: 14,
    textAlign: 'center',
  },
  socialSection: {
    marginTop: 24,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    paddingHorizontal: 8,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    backgroundColor: 'rgba(17,24,39,0.5)',
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  socialBtnText: {
    color: '#fff',
  },
});
