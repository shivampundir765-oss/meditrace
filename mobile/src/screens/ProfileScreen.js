import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, TextInput, FlatList, ActivityIndicator, Alert, ScrollView } from 'react-native';
import mobileClient from '../api/client';

export default function ProfileScreen({ user, onLogout }) {
  const [profile, setProfile] = useState(user || null);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [pushRegistered, setPushRegistered] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchNotifications();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await mobileClient.get('/users/me');
      if (res.data?.user) {
        setProfile(res.data.user);
        if (res.data.user.quietHoursStart) setQuietStart(res.data.user.quietHoursStart);
        if (res.data.user.quietHoursEnd) setQuietEnd(res.data.user.quietHoursEnd);
      }
    } catch (_e) {}
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await mobileClient.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (_e) {
      setNotifications([]);
    } finally {
      setLoadingNotifs(false);
    }
  };

  const handleRegisterPushToken = async () => {
    try {
      const simulatedToken = `ExponentPushToken[mock_device_${Date.now()}]`;
      await mobileClient.post('/notifications/push-token', {
        pushToken: simulatedToken,
        platform: 'android'
      });
      setPushRegistered(true);
      Alert.alert('Push Notifications Enabled', 'Your mobile device has been linked for instant dose reminders.');
    } catch (err) {
      Alert.alert('Registration Failed', err.message || 'Could not register push token');
    }
  };

  const handleSaveQuietHours = async () => {
    setSavingSettings(true);
    try {
      await mobileClient.put('/users/me', {
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd
      });
      Alert.alert('Saved', 'Quiet hours updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to update quiet hours');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await mobileClient.put('/notifications/read-all');
      fetchNotifications();
    } catch (_e) {}
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* User Info Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(profile?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{profile?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{profile?.role?.toUpperCase() || 'PATIENT'}</Text>
          </View>
        </View>
      </View>

      {/* Push Notification Hook Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Device Push Notifications</Text>
        <Text style={styles.sectionSub}>Receive audio alerts when doses are due or stock is low.</Text>

        <TouchableOpacity
          style={[styles.pushBtn, pushRegistered && styles.pushBtnActive]}
          onPress={handleRegisterPushToken}
          disabled={pushRegistered}
        >
          <Text style={[styles.pushBtnText, pushRegistered && styles.pushBtnTextActive]}>
            {pushRegistered ? '✓ Push Alerts Active' : '🔔 Enable Mobile Push Notifications'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quiet Hours Settings */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Quiet Hours Schedule</Text>
        <Text style={styles.sectionSub}>Silence non-emergency reminders during your sleep window.</Text>

        <View style={styles.timeRow}>
          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>Start Time</Text>
            <TextInput
              style={styles.timeInput}
              value={quietStart}
              onChangeText={setQuietStart}
              placeholder="22:00"
            />
          </View>

          <View style={styles.timeBox}>
            <Text style={styles.timeLabel}>End Time</Text>
            <TextInput
              style={styles.timeInput}
              value={quietEnd}
              onChangeText={setQuietEnd}
              placeholder="07:00"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSaveQuietHours}
          disabled={savingSettings}
        >
          {savingSettings ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Schedule</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Notifications Inbox */}
      <View style={styles.sectionCard}>
        <View style={styles.notifHeader}>
          <Text style={styles.sectionTitle}>Recent Notifications</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {loadingNotifs ? (
          <ActivityIndicator size="small" color="#0d9488" style={{ marginVertical: 12 }} />
        ) : notifications.length === 0 ? (
          <Text style={styles.emptyNotif}>No unread notifications.</Text>
        ) : (
          notifications.slice(0, 5).map((n) => (
            <View key={n._id} style={[styles.notifItem, !n.isRead && styles.notifUnread]}>
              <Text style={styles.notifTitle}>{n.title}</Text>
              <Text style={styles.notifMsg}>{n.message}</Text>
            </View>
          ))
        )}
      </View>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Log Out of Meditrace</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8fafc',
    paddingBottom: 40
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800'
  },
  userInfo: {
    flex: 1
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  userEmail: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4
  },
  roleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0d9488'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12
  },
  pushBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center'
  },
  pushBtnActive: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#0d9488'
  },
  pushBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  pushBtnTextActive: {
    color: '#0d9488'
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  timeBox: {
    flex: 1
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#ffffff'
  },
  saveBtn: {
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center'
  },
  saveBtnText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700'
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  markReadText: {
    fontSize: 11,
    color: '#0d9488',
    fontWeight: '600'
  },
  emptyNotif: {
    fontSize: 11,
    color: '#94a3b8',
    paddingVertical: 8
  },
  notifItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc'
  },
  notifUnread: {
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginBottom: 4
  },
  notifTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  notifMsg: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  logoutBtn: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  logoutBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700'
  }
});
