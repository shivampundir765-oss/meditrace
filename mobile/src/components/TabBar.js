import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const TABS = [
  { key: 'home', label: 'Home', icon: '🏠' },
  { key: 'scan', label: 'Scan', icon: '📷' },
  { key: 'medicines', label: 'Medicines', icon: '💊' },
  { key: 'nearby', label: 'Nearby', icon: '📍' },
  { key: 'profile', label: 'Profile', icon: '👤' }
];

export default function TabBar({ activeTab, onSelectTab }) {
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, isActive && styles.tabItemActive]}
            onPress={() => onSelectTab(tab.key)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>{tab.icon}</Text>
            <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 4
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: '#0d9488'
  },
  tabIcon: {
    fontSize: 18,
    marginBottom: 2,
    opacity: 0.6
  },
  tabIconActive: {
    opacity: 1
  },
  tabLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500'
  },
  tabLabelActive: {
    color: '#0d9488',
    fontWeight: '700'
  }
});
