import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Text } from '../components/ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Music2, Sparkles } from 'lucide-react-native';

export default function SplashScreen() {
  const scale = useRef(new Animated.Value(0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: 2000, useNativeDriver: true })
    ).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient
      colors={['#050A18', '#061A2B', '#050A18']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ rotate: spin }] }]}>
          <Music2 size={66} color="#22D3EE" strokeWidth={1.5} />
        </Animated.View>
        <Text style={styles.title}>SpotLight</Text>
        <View style={styles.subtitleRow}>
          <Sparkles size={18} color="rgba(34,211,238,0.9)" />
          <Text style={styles.subtitleText}>Discover. Book. Perform.</Text>
        </View>
        <View style={styles.bottomGlow} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 24,
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 10,
    letterSpacing: -0.6,
  },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '700',
  },

  bottomGlow: {
    marginTop: 22,
    width: 220,
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(34,211,238,0.25)',
    shadowColor: '#22D3EE',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
});
