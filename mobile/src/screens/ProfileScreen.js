import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Linking
} from 'react-native';
import mobileClient from '../api/client';
import storage from '../api/storage';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function ProfileScreen({ user, onLogout }) {
  const { t, language, setLanguage } = useTranslation();
  const { profiles, activeProfile, switchProfile, addFamilyMember } = useProfile();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('07:00');
  const [savingSettings, setSavingSettings] = useState(false);

  // Add Family Member Modal
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('mother');
  const [memberAccess, setMemberAccess] = useState('caregiver_edit');
  const [memberAge, setMemberAge] = useState('');
  const [memberBloodGroup, setMemberBloodGroup] = useState('O+');
  const [addingMember, setAddingMember] = useState(false);

  // Legal & Medical Notice Modal
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // Backend Server Connection & Offline Mode State
  const [serverUrl, setServerUrl] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const storedPush = await storage.getItem('meditrace_push_notifications');
      if (storedPush !== null) {
        setPushEnabled(storedPush === 'true');
      }
      const storedUrl = await storage.getItem('meditrace_server_url');
      if (storedUrl) setServerUrl(storedUrl);
      const storedOffline = await storage.getItem('meditrace_offline_mode');
      if (storedOffline !== null) setOfflineMode(storedOffline === 'true');
    } catch (_e) {}
  };

  const handleToggleOfflineMode = async (val) => {
    setOfflineMode(val);
    await mobileClient.setOfflineMode(val);
    Alert.alert(
      val ? 'Standalone Offline Mode Enabled' : 'Online Sync Mode Enabled',
      val
        ? 'App is operating with local storage only. No network requests are made.'
        : 'App will now connect to the specified backend server.'
    );
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const ok = await mobileClient.testConnection(serverUrl.trim());
      setConnectionStatus(ok ? 'connected' : 'failed');
      if (ok) {
        Alert.alert('Connection Successful', `Connected to MediTrace API at ${serverUrl.trim() || 'default URL'}`);
      } else {
        Alert.alert('Connection Failed', `Could not reach ${serverUrl.trim() || 'default URL'}. Using automatic local demo fallback.`);
      }
    } catch (_e) {
      setConnectionStatus('failed');
      Alert.alert('Connection Notice', 'Could not reach server. Automatic demo fallback active.');
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSaveServerUrl = async () => {
    await mobileClient.setServerUrl(serverUrl.trim());
    Alert.alert('Server URL Saved', serverUrl.trim() ? `Server set to ${serverUrl.trim()}` : 'Reset to default backend address.');
  };

  const handleTogglePush = async (val) => {
    setPushEnabled(val);
    await storage.setItem('meditrace_push_notifications', val ? 'true' : 'false');
    if (!val) {
      Alert.alert(
        'Push Notifications Paused',
        'System push alerts are turned off. In-app alerts, visual badges, and local reminders will continue to safeguard your schedule.'
      );
    }
  };

  const handleAddMember = async () => {
    if (!memberName.trim()) {
      Alert.alert('Required', 'Please enter family member name');
      return;
    }
    setAddingMember(true);
    try {
      await addFamilyMember({
        name: memberName.trim(),
        relationship: memberRelation,
        access_level: memberAccess,
        age: parseInt(memberAge, 10) || undefined,
        blood_group: memberBloodGroup
      });
      setShowAddMemberModal(false);
      setMemberName('');
      setMemberAge('');
      Alert.alert('Member Added', `${memberName.trim()} added to your family profiles.`);
    } catch (err) {
      Alert.alert('Failed', err.message || 'Could not add family profile');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCallEmergency = () => {
    Linking.openURL('tel:112');
  };

  const relationships = [
    { label: 'Mother', value: 'mother' },
    { label: 'Father', value: 'father' },
    { label: 'Spouse', value: 'spouse' },
    { label: 'Child', value: 'child' },
    { label: 'Other', value: 'other' }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(activeProfile?.name || user?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{activeProfile?.name || user?.name || 'Arjun Rao'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'arjun@meditrace.health'}</Text>
          <View style={styles.badgeRow}>
            <View style={styles.roleTag}>
              <Text style={styles.roleTagText}>
                {activeProfile?.relationship?.toUpperCase() || 'SELF'}
              </Text>
            </View>
            <View style={[styles.roleTag, { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' }]}>
              <Text style={[styles.roleTagText, { color: '#475569' }]}>
                {activeProfile?.access_level || 'Owner'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Language Selector Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Language / भाषा</Text>
        <Text style={styles.sectionSub}>Select your preferred interface and chatbot language</Text>
        <View style={styles.langBtnRow}>
          <TouchableOpacity
            style={[styles.langChoiceBtn, language === 'en' && styles.langChoiceBtnActive]}
            onPress={() => setLanguage('en')}
          >
            <Text style={[styles.langChoiceText, language === 'en' && styles.langChoiceTextActive]}>
              English (EN)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langChoiceBtn, language === 'hi' && styles.langChoiceBtnActive]}
            onPress={() => setLanguage('hi')}
          >
            <Text style={[styles.langChoiceText, language === 'hi' && styles.langChoiceTextActive]}>
              हिन्दी (Hindi)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Family Mode & Profiles (Feature 6) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>{t('family.title')}</Text>
            <Text style={styles.sectionSub}>Completely isolated records per member</Text>
          </View>
          <TouchableOpacity
            style={styles.addMemberHeaderBtn}
            onPress={() => setShowAddMemberModal(true)}
          >
            <Text style={styles.addMemberHeaderBtnText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profilesList}>
          {profiles.map((p) => {
            const isCurrent = activeProfile?._id === p._id;
            return (
              <TouchableOpacity
                key={p._id}
                style={[styles.profileCard, isCurrent && styles.profileCardActive]}
                onPress={() => switchProfile(p)}
              >
                <View style={styles.profileCardAvatar}>
                  <Text style={styles.profileCardAvatarText}>
                    {p.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.profileCardInfo}>
                  <Text style={styles.profileCardName}>{p.name}</Text>
                  <Text style={styles.profileCardMeta}>
                    {p.relationship?.toUpperCase()} • {p.access_level}
                    {p.blood_group ? ` • ${p.blood_group}` : ''}
                  </Text>
                </View>
                {isCurrent && (
                  <View style={styles.activePill}>
                    <Text style={styles.activePillText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Push Notifications Toggle */}
      <View style={styles.sectionCard}>
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.sectionTitle}>Push Notifications</Text>
            <Text style={styles.sectionSub}>
              Device reminders for doses and low stock alerts. In-app alerts remain active if turned off.
            </Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={handleTogglePush}
            trackColor={{ false: '#cbd5e1', true: '#99f6e4' }}
            thumbColor={pushEnabled ? '#0d9488' : '#94a3b8'}
          />
        </View>
      </View>

      {/* Backend Server & Standalone Mode Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Backend Connection &amp; Mode</Text>
        <Text style={styles.sectionSub}>
          Configure custom server IP (e.g. for testing over local Wi-Fi) or enable Standalone Offline Mode.
        </Text>

        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.modeOptionTitle}>Standalone / Offline Mode</Text>
            <Text style={styles.modeOptionSub}>
              Use local on-device database without network delays.
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={handleToggleOfflineMode}
            trackColor={{ false: '#cbd5e1', true: '#99f6e4' }}
            thumbColor={offlineMode ? '#0d9488' : '#94a3b8'}
          />
        </View>

        {!offlineMode && (
          <View style={styles.serverConfigBox}>
            <Text style={styles.inputLabel}>Server Base URL (Optional)</Text>
            <TextInput
              style={styles.serverInput}
              placeholder="e.g. http://192.168.1.15:5000/api/v1"
              value={serverUrl}
              onChangeText={setServerUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.serverBtnRow}>
              <TouchableOpacity
                style={styles.saveUrlBtn}
                onPress={handleSaveServerUrl}
              >
                <Text style={styles.saveUrlBtnText}>Save URL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.testUrlBtn}
                onPress={handleTestConnection}
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <ActivityIndicator size="small" color="#0d9488" />
                ) : (
                  <Text style={styles.testUrlBtnText}>Test Connection</Text>
                )}
              </TouchableOpacity>
            </View>
            {connectionStatus && (
              <Text style={[styles.connectionStatusText, connectionStatus === 'connected' ? styles.statusConnected : styles.statusFailed]}>
                {connectionStatus === 'connected' ? '✓ Server reachable' : '✕ Server unreachable - using demo fallback'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Important Medical and Legal Notice Button */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>{t('legal.title')}</Text>
        <Text style={styles.sectionSub}>Review disclaimer protocols, clinical liability terms, and emergency numbers</Text>

        <TouchableOpacity
          style={styles.legalBtn}
          onPress={() => setShowNoticeModal(true)}
        >
          <Text style={styles.legalBtnText}>📜 View Legal &amp; Medical Notice</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emergencyQuickBtn}
          onPress={handleCallEmergency}
        >
          <Text style={styles.emergencyQuickBtnText}>🚨 Call 112 / 108 Emergency Services</Text>
        </TouchableOpacity>
      </View>

      {/* Log Out Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutBtnText}>Log Out of MediTrace</Text>
      </TouchableOpacity>

      {/* Add Family Member Modal */}
      <Modal
        visible={showAddMemberModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMemberModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('family.add_member')}</Text>
              <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Lakshmi Rao"
                value={memberName}
                onChangeText={setMemberName}
              />

              <Text style={styles.inputLabel}>{t('family.relationship')}</Text>
              <View style={styles.chipRow}>
                {relationships.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.chip,
                      memberRelation === r.value && styles.chipActive
                    ]}
                    onPress={() => setMemberRelation(r.value)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        memberRelation === r.value && styles.chipTextActive
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>{t('family.access_level')}</Text>
              <View style={styles.accessRow}>
                <TouchableOpacity
                  style={[
                    styles.accessBtn,
                    memberAccess === 'caregiver_edit' && styles.accessBtnActive
                  ]}
                  onPress={() => setMemberAccess('caregiver_edit')}
                >
                  <Text style={[styles.accessBtnText, memberAccess === 'caregiver_edit' && styles.accessBtnTextActive]}>
                    Caregiver (Edit)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.accessBtn,
                    memberAccess === 'caregiver_view' && styles.accessBtnActive
                  ]}
                  onPress={() => setMemberAccess('caregiver_view')}
                >
                  <Text style={[styles.accessBtnText, memberAccess === 'caregiver_view' && styles.accessBtnTextActive]}>
                    Caregiver (View Only)
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Age</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="e.g. 72"
                    value={memberAge}
                    onChangeText={setMemberAge}
                  />
                </View>
                <View style={styles.col}>
                  <Text style={styles.inputLabel}>Blood Group</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. O+"
                    value={memberBloodGroup}
                    onChangeText={setMemberBloodGroup}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.submitMemberBtn}
                onPress={handleAddMember}
                disabled={addingMember}
              >
                {addingMember ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitMemberBtnText}>Add Profile</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Important Medical and Legal Notice Modal */}
      <Modal
        visible={showNoticeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNoticeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('legal.title')}</Text>
              <TouchableOpacity onPress={() => setShowNoticeModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.noticeBody}>
              <View style={styles.noticeSection}>
                <Text style={styles.noticeHeading}>1. Auxiliary Health Tool</Text>
                <Text style={styles.noticeParagraph}>{t('legal.section1')}</Text>
              </View>

              <View style={styles.noticeSection}>
                <Text style={styles.noticeHeading}>2. Professional Consultation Required</Text>
                <Text style={styles.noticeParagraph}>{t('legal.section2')}</Text>
              </View>

              <View style={styles.noticeSection}>
                <Text style={styles.noticeHeading}>3. Life-Threatening Emergencies</Text>
                <Text style={styles.noticeParagraph}>{t('legal.section3')}</Text>
              </View>

              <TouchableOpacity
                style={styles.emergencyActionBtn}
                onPress={handleCallEmergency}
              >
                <Text style={styles.emergencyActionBtnText}>🚨 Call 112 / 108 Immediately</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  content: {
    padding: 14
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
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
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6
  },
  roleTag: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2
  },
  roleTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0d9488'
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  langBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  langChoiceBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  langChoiceBtnActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  langChoiceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569'
  },
  langChoiceTextActive: {
    color: '#ffffff'
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  addMemberHeaderBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#0d9488',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4
  },
  addMemberHeaderBtnText: {
    color: '#0d9488',
    fontSize: 11,
    fontWeight: '700'
  },
  profilesList: {
    marginTop: 12,
    gap: 6
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  profileCardActive: {
    backgroundColor: '#f0fdfa',
    borderColor: '#0d9488'
  },
  profileCardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  profileCardAvatarText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  profileCardInfo: {
    flex: 1
  },
  profileCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  profileCardMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1
  },
  activePill: {
    backgroundColor: '#0d9488',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3
  },
  activePillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  switchTextWrap: {
    flex: 1,
    marginRight: 10
  },
  legalBtn: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 10
  },
  legalBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  emergencyQuickBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8
  },
  emergencyQuickBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#b91c1c'
  },
  logoutBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginVertical: 10
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
    marginBottom: 10
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  modalClose: {
    fontSize: 18,
    color: '#64748b',
    padding: 4
  },
  modalBody: {
    paddingVertical: 4
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 3,
    marginTop: 8
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    color: '#0f172a'
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  chipActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  chipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600'
  },
  chipTextActive: {
    color: '#ffffff'
  },
  accessRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  accessBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center'
  },
  accessBtnActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  accessBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  accessBtnTextActive: {
    color: '#ffffff'
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8
  },
  col: {
    flex: 1
  },
  submitMemberBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8
  },
  submitMemberBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  noticeBody: {
    paddingVertical: 6
  },
  noticeSection: {
    marginBottom: 12
  },
  noticeHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  noticeParagraph: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18
  },
  emergencyActionBtn: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12
  },
  emergencyActionBtnText: {
    color: '#b91c1c',
    fontSize: 13,
    fontWeight: '700'
  },
  modeOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  modeOptionSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  serverConfigBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  serverInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 12,
    color: '#0f172a',
    marginTop: 4
  },
  serverBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  saveUrlBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center'
  },
  saveUrlBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  testUrlBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 9,
    borderRadius: 6,
    alignItems: 'center'
  },
  testUrlBtnText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600'
  },
  connectionStatusText: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600'
  },
  statusConnected: {
    color: '#15803d'
  },
  statusFailed: {
    color: '#b91c1c'
  }
});
