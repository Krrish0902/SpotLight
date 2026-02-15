import React, { useState } from 'react';
import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Text } from './Text';
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

  const setTab = (value: string) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  const TabBar = fullWidth ? (
    <View style={[styles.tabList, styles.tabListFullWidth]}>
      {tabs.map((tab) => (
        <Pressable
          key={tab.value}
          style={[
            styles.tabTrigger,
            fullWidth && styles.tabTriggerFullWidth,
            activeTab === tab.value && styles.tabTriggerActive,
          ]}
          onPress={() => setTab(tab.value)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.value && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.tabList}
      style={styles.tabListScroll}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.value}
          style={[
            styles.tabTrigger,
            activeTab === tab.value && styles.tabTriggerActive,
          ]}
          onPress={() => setTab(tab.value)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.value && styles.tabTextActive,
            ]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
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
    backgroundColor: colors['white/5'],
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabListFullWidth: {
    width: '100%',
    marginBottom: 24,
  },
  tabTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  tabTriggerFullWidth: {
    flex: 1,
  },
  tabTriggerActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors['white/60'],
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
});
