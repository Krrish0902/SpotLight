import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Easing, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, TrendingUp, AlertTriangle, Info, ThumbsUp, ThumbsDown } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

interface Insight {
  title: string;
  body: string;
  type: 'positive' | 'negative' | 'neutral' | 'tip';
}

const TYPE_CONFIG = {
  positive: { Icon: TrendingUp,    colors: ['rgba(16,185,129,0.18)', 'rgba(16,185,129,0.06)'] as [string,string], accent: '#10B981', border: 'rgba(16,185,129,0.25)' },
  negative: { Icon: AlertTriangle, colors: ['rgba(244,63,94,0.18)', 'rgba(244,63,94,0.06)'] as [string,string],  accent: '#F43F5E', border: 'rgba(244,63,94,0.25)' },
  tip:      { Icon: Sparkles,      colors: ['rgba(245,158,11,0.18)', 'rgba(245,158,11,0.06)'] as [string,string], accent: '#F59E0B', border: 'rgba(245,158,11,0.25)' },
  neutral:  { Icon: Info,          colors: ['rgba(99,102,241,0.18)', 'rgba(99,102,241,0.06)'] as [string,string], accent: '#6366F1', border: 'rgba(99,102,241,0.25)' },
};

export const AIInsightCard: React.FC<{ artistId: string; metrics: any }> = ({ artistId, metrics }) => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    async function fetchInsights() {
      if (!artistId || !metrics || Object.keys(metrics).length === 0) return;
      const cacheKey = `insight_cache_${artistId}_${Math.floor(Date.now() / 21600000)}`;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) { setInsights(JSON.parse(cached)); setLoading(false); return; }
        const { data, error } = await supabase.functions.invoke('generate-analytics-insight', { body: { metrics } });
        if (error) throw error;
        if (data?.insights) {
          await AsyncStorage.setItem(cacheKey, JSON.stringify(data.insights));
          setInsights(data.insights);
        }
      } catch { /* silent fail */ } finally { setLoading(false); }
    }
    fetchInsights();
  }, [artistId, metrics]);

  const recordFeedback = (title: string, helpful: boolean) => {
    supabase.from('analytics_events').insert({
      event_type: 'insight_feedback', target_user_id: artistId, viewer_id: artistId,
      source: helpful ? 'helpful' : 'not_helpful'
    }).catch(() => {});
  };

  if (loading) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
        {[1, 2, 3].map(i => (
          <Animated.View key={i} style={[styles.skeletonCard, { opacity: shimmer }]}>
            <View style={styles.skeletonIcon} />
            <View style={styles.skeletonTitle} />
            <View style={[styles.skeletonLine, { width: '100%' }]} />
            <View style={[styles.skeletonLine, { width: '75%' }]} />
          </Animated.View>
        ))}
      </ScrollView>
    );
  }

  if (insights.length === 0) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingVertical: 4 }}>
      {insights.map((insight, idx) => {
        const cfg = TYPE_CONFIG[insight.type] || TYPE_CONFIG.neutral;
        const { Icon, colors, accent, border } = cfg;
        return (
          <View key={idx} style={[styles.cardWrap, { borderColor: border }]}>
            <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
            {/* Left accent bar */}
            <View style={[styles.leftBar, { backgroundColor: accent }]} />

            <View style={styles.cardBody}>
              {/* Icon chip */}
              <View style={[styles.iconChip, { backgroundColor: `${accent}20` }]}>
                <Icon size={14} color={accent} />
              </View>

              <Text style={[styles.insightTitle, { color: accent }]} numberOfLines={2}>{insight.title}</Text>
              <Text style={styles.insightBody}>{insight.body}</Text>

              <View style={styles.feedbackRow}>
                <TouchableOpacity onPress={() => recordFeedback(insight.title, true)} style={styles.feedbackBtn}>
                  <ThumbsUp size={12} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => recordFeedback(insight.title, false)} style={styles.feedbackBtn}>
                  <ThumbsDown size={12} color="rgba(255,255,255,0.3)" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardWrap: {
    width: 248,
    marginRight: 14,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  cardBody: {
    flex: 1,
    padding: 16,
    paddingLeft: 14,
  },
  leftBar: {
    width: 3,
  },
  iconChip: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.1,
    marginBottom: 6,
    lineHeight: 18,
  },
  insightBody: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
    marginBottom: 14,
  },
  feedbackRow: {
    flexDirection: 'row',
    gap: 12,
  },
  feedbackBtn: {
    padding: 4,
  },
  // Skeleton
  skeletonCard: {
    width: 248,
    marginRight: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: 18,
  },
  skeletonIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
  },
  skeletonTitle: {
    height: 13,
    width: '65%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    marginBottom: 12,
  },
  skeletonLine: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    marginBottom: 8,
  },
});
