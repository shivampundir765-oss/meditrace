import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useProfile } from '../context/ProfileContext';
import { useTranslation } from '../i18n';

export default function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile, addFamilyMember } = useProfile();
  const { t } = useTranslation();

  const [modalVisible, setModalVisible] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRelationship, setNewRelationship] = useState('mother');
  const [newAccess, setNewAccess] = useState('caregiver_edit');
  const [saving, setSaving] = useState(false);

  const relationships = [
    { label: 'Mother', value: 'mother' },
    { label: 'Father', value: 'father' },
    { label: 'Spouse', value: 'spouse' },
    { label: 'Child', value: 'child' },
    { label: 'Other', value: 'other' }
  ];

  const handleSelectProfile = (p) => {
    switchProfile(p);
    setModalVisible(false);
    setShowAddForm(false);
  };

  const handleCreateMember = async () => {
    if (!newName.trim()) {
      Alert.alert('Required', 'Please enter a name for the family member');
      return;
    }
    setSaving(true);
    try {
      await addFamilyMember({
        name: newName.trim(),
        relationship: newRelationship,
        access_level: newAccess
      });
      setNewName('');
      setShowAddForm(false);
      Alert.alert('Success', 'Family member profile added.');
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not add family member');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        style={styles.pillContainer}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.avatarMini}>
          <Text style={styles.avatarMiniText}>
            {(activeProfile?.name || 'U').charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName} numberOfLines={1}>
          {activeProfile?.name || 'My Profile'}
        </Text>
        <Text style={styles.relationTag}>
          {activeProfile?.relationship ? `(${activeProfile.relationship})` : ''}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('family.switch_profile')}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {!showAddForm ? (
              <>
                <FlatList
                  data={profiles}
                  keyExtractor={(item) => item._id}
                  renderItem={({ item }) => {
                    const isActive = activeProfile?._id === item._id;
                    return (
                      <TouchableOpacity
                        style={[styles.profileItem, isActive && styles.profileItemActive]}
                        onPress={() => handleSelectProfile(item)}
                      >
                        <View style={styles.avatarMedium}>
                          <Text style={styles.avatarMediumText}>
                            {item.name.charAt(0).toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.itemInfo}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={styles.itemMeta}>
                            {item.relationship?.toUpperCase()} • {item.access_level || 'Owner'}
                          </Text>
                        </View>
                        {isActive && <Text style={styles.checkMark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }}
                />

                <TouchableOpacity
                  style={styles.addMemberBtn}
                  onPress={() => setShowAddForm(true)}
                >
                  <Text style={styles.addMemberBtnText}>+ {t('family.add_member')}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.formContainer}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lakshmi Rao"
                  value={newName}
                  onChangeText={setNewName}
                />

                <Text style={styles.inputLabel}>Relationship</Text>
                <View style={styles.chipRow}>
                  {relationships.map((r) => (
                    <TouchableOpacity
                      key={r.value}
                      style={[
                        styles.chip,
                        newRelationship === r.value && styles.chipActive
                      ]}
                      onPress={() => setNewRelationship(r.value)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          newRelationship === r.value && styles.chipTextActive
                        ]}
                      >
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.saveMemberBtn}
                  onPress={handleCreateMember}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveMemberBtnText}>Save Profile</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelFormBtn}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelFormBtnText}>Back to Profile List</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6
  },
  avatarMini: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  avatarMiniText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  profileName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    maxWidth: 90
  },
  relationTag: {
    fontSize: 9,
    color: '#64748b',
    marginLeft: 3
  },
  chevron: {
    fontSize: 11,
    color: '#0d9488',
    marginLeft: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    padding: 16
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  closeBtn: {
    fontSize: 18,
    color: '#64748b',
    padding: 4
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#f8fafc'
  },
  profileItemActive: {
    backgroundColor: '#ccfbf1',
    borderColor: '#0d9488',
    borderWidth: 1
  },
  avatarMedium: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0d9488',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10
  },
  avatarMediumText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  itemMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  checkMark: {
    color: '#0d9488',
    fontSize: 16,
    fontWeight: 'bold'
  },
  addMemberBtn: {
    marginTop: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#0d9488',
    borderStyle: 'dashed',
    borderRadius: 10,
    alignItems: 'center'
  },
  addMemberBtnText: {
    color: '#0d9488',
    fontWeight: '700',
    fontSize: 13
  },
  formContainer: {
    paddingVertical: 8
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 6,
    marginBottom: 6
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
  saveMemberBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  saveMemberBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  cancelFormBtn: {
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6
  },
  cancelFormBtnText: {
    color: '#64748b',
    fontSize: 12
  }
});
