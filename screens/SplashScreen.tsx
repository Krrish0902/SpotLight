import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
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
      colors={['#9333ea', '#db2777', '#f97316']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Animated.View style={[styles.content, { transform: [{ scale }], opacity }]}>
        <Animated.View style={[styles.iconWrapper, { transform: [{ rotate: spin }] }]}>
          <Music2 size={96} color="#fff" strokeWidth={1.5} />
        </Animated.View>
        <Text style={styles.title}>ArtistHub</Text>
        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>Discover. Book. Perform. </Text>
          <Sparkles size={20} color="rgba(255,255,255,0.8)" />
        </View>
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
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtitleText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
});
