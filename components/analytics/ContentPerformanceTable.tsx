import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '../ui/Text';

export interface ContentData {
  video_id: string;
  title: string;
  total_views: number;
  engagement_rate: number;
  booking_converts: number;
}

const RANK_COLORS = ['#F59E0B', '#9CA3AF', '#CD7F32', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.12)'];

function engColor(rate: number): string {
  if (rate >= 10) return '#10B981';
  if (rate >= 5) return '#F59E0B';
  return 'rgba(255,255,255,0.45)';
}

export const ContentPerformanceTable: React.FC<{ data: ContentData[] }> = ({ data }) => {
  const [sortCol, setSortCol] = useState<'views' | 'eng' | 'book'>('views');

  if (!data || data.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No content data yet.</Text>
      </View>
    );
  }

  const sorted = [...data].sort((a, b) => {
    if (sortCol === 'views') return b.total_views - a.total_views;
    if (sortCol === 'eng') return b.engagement_rate - a.engagement_rate;
    return b.booking_converts - a.booking_converts;
  }).slice(0, 5);

  const maxViews = Math.max(...sorted.map(r => r.total_views), 1);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ width: 30 }} />
        <Text style={[styles.colH, { flex: 2 }]}>Content</Text>
        {(['views', 'eng', 'book'] as const).map(col => (
          <TouchableOpacity key={col} style={styles.sortBtn} onPress={() => setSortCol(col)}>
            <Text style={[styles.colH, styles.colHRight, sortCol === col && styles.colHActive]}>
              {col === 'views' ? 'Views' : col === 'eng' ? 'Eng%' : 'Book'}
            </Text>
            {sortCol === col && <View style={styles.activeDot} />}
          </TouchableOpacity>
        ))}
      </View>

      {sorted.map((row, idx) => {
        const viewsPct = (row.total_views / maxViews) * 100;
        const isLast = idx === sorted.length - 1;
        return (
          <View key={idx} style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
            <View style={[styles.rankBadge, { borderColor: `${RANK_COLORS[idx]}50`, backgroundColor: `${RANK_COLORS[idx]}14` }]}>
              <Text style={[styles.rankText, { color: RANK_COLORS[idx] }]}>{idx + 1}</Text>
            </View>
            <View style={{ flex: 2, paddingRight: 10 }}>
              <Text style={styles.titleText} numberOfLines={1}>{row.title || 'Untitled'}</Text>
              <View style={styles.miniTrack}>
                <View style={[styles.miniBar, { width: `${viewsPct}%` }]} />
              </View>
            </View>
            <Text style={[styles.num, { flex: 1 }]}>
              {row.total_views >= 1000 ? `${(row.total_views / 1000).toFixed(1)}k` : row.total_views}
            </Text>
            <Text style={[styles.num, { flex: 1, color: engColor(Number(row.engagement_rate)) }]}>
              {Number(row.engagement_rate).toFixed(1)}%
            </Text>
            <Text style={[styles.num, { flex: 1, color: row.booking_converts > 0 ? '#10B981' : 'rgba(255,255,255,0.2)' }]}>
              {row.booking_converts}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    overflow: 'hidden',
    marginTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    gap: 4,
  },
  colH: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  colHRight: { textAlign: 'right' },
  colHActive: { color: '#6366F1' },
  sortBtn: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#6366F1',
    alignSelf: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 4,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  rankText: {
    fontSize: 10,
    fontWeight: '800',
  },
  titleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 5,
  },
  miniTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  miniBar: {
    height: '100%',
    backgroundColor: 'rgba(99,102,241,0.55)',
    borderRadius: 2,
  },
  num: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
  empty: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 13,
  },
});
