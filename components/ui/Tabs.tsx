import React, { useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, ScrollView, LayoutChangeEvent } from 'react-native';
import { Text } from './Text';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '../../theme';

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  defaultValue: string;
  tabs: TabItem[];
  onValueChange?: (value: string) => void;
  fullWidth?: boolean;
  children: (value: string) => React.ReactNode;
}

export function Tabs({ defaultValue, tabs, onValueChange, fullWidth, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  const activeIndex = Math.max(0, tabs.findIndex(t => t.value === activeTab));
  const tabWidthPct = 100 / tabs.length;

  // Reanimated values for sliding pill
  const activeIndexAnim = useSharedValue(activeIndex);

  useEffect(() => {
    activeIndexAnim.value = withSpring(activeIndex, { damping: 20, stiffness: 200, mass: 0.5 });
  }, [activeIndex]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      left: `${activeIndexAnim.value * tabWidthPct}%`,
      width: `${tabWidthPct}%`,
    };
  });

  const setTab = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  const TabBar = fullWidth ? (
    <View style={[styles.tabList, styles.tabListFullWidth]}>
      <Animated.View style={[styles.activeIndicator, animatedIndicatorStyle]} />
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            style={[styles.tabTrigger, styles.tabTriggerFullWidth]}
            onPress={() => setTab(tab.value)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabList}
      style={styles.tabListScroll}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <Pressable
            key={tab.value}
            style={[
              styles.tabTrigger,
              isActive && { backgroundColor: '#FDF2FF' },
            ]}
            onPress={() => setTab(tab.value)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      {TabBar}
      <View style={styles.content}>{children(activeTab)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabListScroll: {
    marginBottom: 24,
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
    padding: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  tabListFullWidth: {
    width: '100%',
    marginBottom: 24,
  },
  activeIndicator: {
    position: 'absolute',
    height: '100%',
    top: 4,
    bottom: 4,
    left: 4,
    backgroundColor: '#FDF2FF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  tabTrigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    zIndex: 1,
  },
  tabTriggerFullWidth: {
    flex: 1,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#162447',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
});
