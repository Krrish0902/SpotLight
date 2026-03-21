import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from '../ui/Text';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ACCENTS = ['#6366F1', '#10B981', '#F59E0B', '#A78BFA', '#F43F5E', '#06B6D4'];

interface MetricCardProps {
  label: string;
  value: number;
  previousValue?: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'percent' | 'currency';
  accentColor?: string;
  index?: number;
}

function formatValue(val: number, format?: string, prefix?: string, suffix?: string) {
  let f = '';
  if (format === 'percent') f = `${val.toFixed(1)}%`;
  else if (format === 'currency') f = `$${val.toLocaleString()}`;
  else f = val.toLocaleString();
  return `${prefix || ''}${f}${suffix || ''}`;
}

export function MetricCard({ label, value, previousValue, prefix, suffix, format = 'number', accentColor, index = 0 }: MetricCardProps) {
  const [displayValue, setDisplayValue] = React.useState(0);
  const accent = accentColor || ACCENTS[index % ACCENTS.length];

  useEffect(() => {
    let start = 0;
    const duration = 1100;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayValue(Math.floor(eased * value));
      if (p < 1) requestAnimationFrame(step);
      else setDisplayValue(value);
    };
    requestAnimationFrame(step);
  }, [value]);

  const pctChange = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const isPositive = pctChange > 0;
  const isNegative = pctChange < 0;
  const trendColor = isPositive ? '#10B981' : isNegative ? '#F43F5E' : '#6B7280';

  return (
    <Animated.View entering={FadeInUp.delay(index * 90).springify()} style={[styles.card, { borderColor: `${accent}28` }]}>
      <LinearGradient
        colors={[accent, `${accent}00`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topStrip}
      />
      <View style={styles.body}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, Platform.select({
          web: { textShadow: `0 0 20px ${accent}99` } as any,
          default: { textShadowColor: `${accent}60`, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 },
        })]}>
          {formatValue(displayValue, format, prefix, suffix)}
        </Text>
        {previousValue !== undefined && (
          <View style={[styles.pill, { backgroundColor: `${trendColor}14`, borderColor: `${trendColor}35` }]}>
            {isPositive ? <TrendingUp size={9} color={trendColor} /> : isNegative ? <TrendingDown size={9} color={trendColor} /> : <Minus size={9} color={trendColor} />}
            <Text style={[styles.pillText, { color: trendColor }]}>{Math.abs(pctChange).toFixed(1)}%</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 152,
    marginRight: 12,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  topStrip: {
    height: 3,
  },
  body: {
    padding: 16,
    paddingTop: 14,
  },
  label: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  value: {
    color: '#fff',
    fontSize: 27,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
});
