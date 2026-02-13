import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Mail, Lock, Phone } from 'lucide-react-native';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card } from '../components/ui/Card';
import { Tabs } from '../components/ui/Tabs';

interface Props {
  navigate: (screen: string) => void;
}

export default function LoginSignup({ navigate }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const handleLogin = () => {
    navigate('role-selection');
  };

  return (
    <LinearGradient colors={['#030712', '#000']} style={styles.container}>
      <View style={styles.header}>
        <Button variant="ghost" size="icon" onPress={() => navigate('public-home')}>
          <ChevronLeft size={24} color="#fff" />
        </Button>
        <Text style={styles.title}>Welcome Back</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.card}>
          <Tabs
            defaultValue="login"
            tabs={[
              { value: 'login', label: 'Login' },
              { value: 'signup', label: 'Sign Up' },
            ]}
          >
            {(activeTab) => activeTab === 'login' ? (
                  <View style={styles.form}>
                    <View style={styles.field}>
                      <Label>Email</Label>
                      <Input
                        leftIcon={<Mail size={20} color="rgba(255,255,255,0.4)" />}
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                      />
                    </View>
                    <View style={styles.field}>
                      <Label>Password</Label>
                      <Input
                        leftIcon={<Lock size={20} color="rgba(255,255,255,0.4)" />}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter your password"
                        secureTextEntry
                      />
                    </View>
                    <Button onPress={handleLogin} style={styles.gradientBtn}>
                      <Text style={styles.btnText}>Login</Text>
                    </Button>
                    <Button variant="ghost" onPress={() => {}}>
                      <Text style={styles.forgotText}>Forgot Password?</Text>
                    </Button>
                  </View>
                ) : (
                  <View style={styles.form}>
                    <View style={styles.field}>
                      <Label>Email</Label>
                      <Input
                        leftIcon={<Mail size={20} color="rgba(255,255,255,0.4)" />}
                        placeholder="Enter your email"
                        keyboardType="email-address"
                      />
                    </View>
                    <View style={styles.field}>
                      <Label>Phone Number</Label>
                      <Input
                        leftIcon={<Phone size={20} color="rgba(255,255,255,0.4)" />}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="Enter your phone number"
                        keyboardType="phone-pad"
                      />
                    </View>
                    <View style={styles.field}>
                      <Label>Password</Label>
                      <Input
                        leftIcon={<Lock size={20} color="rgba(255,255,255,0.4)" />}
                        placeholder="Create a password"
                        secureTextEntry
                      />
                    </View>
                    <Button onPress={handleLogin} style={styles.gradientBtn}>
                      <Text style={styles.btnText}>Create Account</Text>
                    </Button>
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
              <Button variant="outline" style={styles.socialBtn}>
                <Text style={styles.socialBtnText}>Google</Text>
              </Button>
              <Button variant="outline" style={styles.socialBtn}>
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
