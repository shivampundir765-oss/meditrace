import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function DisclaimerBanner() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <TouchableOpacity 
        style={styles.collapsedBar} 
        onPress={() => setCollapsed(false)}
        activeOpacity={0.8}
      >
        <Text style={styles.collapsedText}>⚠️ Medical Disclaimer (Tap to expand)</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentRow}>
        <Text style={styles.icon}>⚠️</Text>
        <View style={styles.textContainer}>
          <Text style={styles.title}>Important Medical & Legal Notice</Text>
          <Text style={styles.body}>
            Meditrace is an informational tool and does not provide medical diagnoses or replace doctor consultations. For acute symptoms or emergencies, call 112 / 911 immediately.
          </Text>
        </View>
        <TouchableOpacity onPress={() => setCollapsed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={styles.closeBtn}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fffbeb',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  icon: {
    fontSize: 14,
    marginRight: 6,
    marginTop: 2
  },
  textContainer: {
    flex: 1
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2
  },
  body: {
    fontSize: 10,
    color: '#b45309',
    lineHeight: 14
  },
  closeBtn: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: 'bold',
    marginLeft: 8,
    padding: 2
  },
  collapsedBar: {
    backgroundColor: '#fef3c7',
    paddingVertical: 4,
    alignItems: 'center'
  },
  collapsedText: {
    fontSize: 10,
    color: '#92400e',
    fontWeight: '600'
  }
});
