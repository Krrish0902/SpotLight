import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors } from '../../theme';

interface TabItem {
  value: string;
  label: string;
}

interface TabsProps {
  defaultValue: string;
  tabs: TabItem[];
  children: (value: string) => React.ReactNode;
}

export function Tabs({ defaultValue, tabs, children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <View style={styles.container}>
      <View style={styles.tabList}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.value}
            style={[
              styles.tabTrigger,
              activeTab === tab.value && styles.tabTriggerActive,
            ]}
            onPress={() => setActiveTab(tab.value)}
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
      <View style={styles.content}>{children(activeTab)}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabList: {
    flexDirection: 'row',
    backgroundColor: colors['white/5'],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabTrigger: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
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
