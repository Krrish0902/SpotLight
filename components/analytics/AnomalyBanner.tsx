import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Text } from '../ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Zap, TrendingDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AnomalyData {
  metric: string;
  today_val: number;
  avg_7d: number;
  z_score: number;
  direction: 'up' | 'down';
}

export const AnomalyBanner: React.FC<{ anomalies: AnomalyData[] }> = ({ anomalies }) => {
  const [visible, setVisible] = useState(false);
  const [activeAnomaly, setActiveAnomaly] = useState<AnomalyData | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    async function checkDismissal() {
      if (!anomalies || anomalies.length === 0) return;
      const sig = anomalies[0];
      const dateKey = new Date().toISOString().split('T')[0];
      const dismissed = await AsyncStorage.getItem(`anomaly_dismissed_${dateKey}_${sig.metric}`);
      if (!dismissed) {
        setActiveAnomaly(sig);
        setVisible(true);
        Animated.parallel([
          Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
          Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();
      }
    }
    checkDismissal();
  }, [anomalies]);

  const handleDismiss = async () => {
    if (!activeAnomaly) return;
    const dateKey = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem(`anomaly_dismissed_${dateKey}_${activeAnomaly.metric}`, 'true');
    Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => setVisible(false));
  };

  if (!visible || !activeAnomaly) return null;

  const isUp = activeAnomaly.direction === 'up';
  const multiplier = (activeAnomaly.today_val / Math.max(activeAnomaly.avg_7d, 1)).toFixed(1);
  const accent = isUp ? '#10B981' : '#F43F5E';
  const gradColors: [string, string, string] = isUp
    ? ['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.06)', 'rgba(16,185,129,0.02)']
    : ['rgba(244,63,94,0.15)', 'rgba(244,63,94,0.06)', 'rgba(244,63,94,0.02)'];

  return (
    <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: opacityAnim }}>
      <LinearGradient
        colors={gradColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.container, { borderColor: `${accent}35` }]}
      >
        {/* Left accent bar */}
        <View style={[styles.leftBar, { backgroundColor: accent }]} />

        {/* Pulsing indicator */}
        <View style={styles.pulseWrapper}>
          <Animated.View style={[styles.pulseRing, { borderColor: accent, opacity: pulseAnim }]} />
          <View style={[styles.pulseDot, { backgroundColor: accent }]} />
        </View>

        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: `${accent}18` }]}>
          {isUp ? <Zap size={16} color={accent} /> : <TrendingDown size={16} color={accent} />}
        </View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={[styles.headline, { color: accent }]}>
            {isUp ? `${multiplier}× spike detected` : 'Unusual activity drop'}
          </Text>
          <Text style={styles.sub}>
            {isUp
              ? `${activeAnomaly.metric} is far above your 7-day average today.`
              : `Your ${activeAnomaly.metric} are unusually low — check your content.`}
          </Text>
        </View>

        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <X size={14} color="rgba(255,255,255,0.35)" />
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 12,
    paddingVertical: 14,
    paddingRight: 16,
    gap: 12,
    overflow: 'hidden',
  },
  leftBar: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
  },
  pulseWrapper: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  headline: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 2,
  },
  sub: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11.5,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 2,
  },
});
