import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Header({ user, onLogout }) {
  return (
    <View style={styles.header}>
      <View style={styles.branding}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>M</Text>
        </View>
        <View>
          <Text style={styles.appName}>Meditrace</Text>
          <Text style={styles.subText}>Health & Doses</Text>
        </View>
      </View>

      {user && (
        <View style={styles.userContainer}>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{user.role || 'patient'}</Text>
          </View>
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  logoText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  subText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '500'
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roleTag: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 8
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0d9488',
    textTransform: 'uppercase'
  },
  logoutBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  logoutText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '600'
  }
});
