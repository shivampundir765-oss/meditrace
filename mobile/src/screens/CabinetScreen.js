import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, TextInput, Modal, Alert } from 'react-native';
import mobileClient from '../api/client';

export default function CabinetScreen() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  // New Medicine Form State
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dosageForm, setDosageForm] = useState('tablet');
  const [quantity, setQuantity] = useState('30');
  const [expiryDate, setExpiryDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchMedicines = async () => {
    try {
      const res = await mobileClient.get('/medicines');
      setMedicines(res.data.medicines || []);
    } catch (err) {
      // Handle error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleAddMedicine = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter a medicine name');
      return;
    }

    setSubmitting(true);
    try {
      await mobileClient.post('/medicines', {
        name: name.trim(),
        strength: strength.trim() || undefined,
        dosageForm,
        quantity: parseInt(quantity, 10) || 10,
        expiryDate
      });

      setModalVisible(false);
      setName('');
      setStrength('');
      fetchMedicines();
      Alert.alert('Success', `${name} added to your medicine cabinet.`);
    } catch (err) {
      Alert.alert('Failed to Add', err.message || 'Unable to save medicine');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderMedicineCard = ({ item }) => {
    const isLow = item.quantity <= 5;
    const isExpired = new Date(item.expiryDate) < new Date();

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.pillIconBadge}>
            <Text style={styles.pillIcon}>
              {item.dosageForm === 'syrup' ? '🧴' : item.dosageForm === 'injection' ? '💉' : '💊'}
            </Text>
          </View>
          <View style={styles.cardMain}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medSub}>{item.strength || 'Standard'} • {item.dosageForm}</Text>
          </View>

          <View style={[
            styles.stockBadge,
            isExpired ? styles.badgeExpired : isLow ? styles.badgeLow : styles.badgeOk
          ]}>
            <Text style={[
              styles.stockBadgeText,
              isExpired ? styles.textExpired : isLow ? styles.textLow : styles.textOk
            ]}>
              {isExpired ? 'EXPIRED' : `${item.quantity} left`}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.expiryText}>
            Expiry: {new Date(item.expiryDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
          </Text>
          {isLow && !isExpired && (
            <Text style={styles.refillAlert}>⚠️ Refill Soon</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Add Bar */}
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search cabinet medicines..."
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredMedicines}
          keyExtractor={(item) => item._id}
          renderItem={renderMedicineCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchMedicines();
              }}
              colors={['#0d9488']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Cabinet Empty</Text>
              <Text style={styles.emptyText}>Tap "+ Add" to catalogue your first prescription or OTC medicine.</Text>
            </View>
          }
        />
      )}

      {/* Add Medicine Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add to Medicine Cabinet</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <Text style={styles.formLabel}>Brand Name</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Paracetamol / Metformin"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Strength</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 500mg / 10ml"
                value={strength}
                onChangeText={setStrength}
              />

              <Text style={styles.formLabel}>Quantity in Pack</Text>
              <TextInput
                style={styles.formInput}
                placeholder="30"
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />

              <TouchableOpacity
                style={styles.modalSubmit}
                onPress={handleAddMedicine}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Save Medicine</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  topBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    alignItems: 'center'
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#0f172a'
  },
  addBtn: {
    backgroundColor: '#0d9488',
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  pillIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f0fdfa',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  pillIcon: {
    fontSize: 18
  },
  cardMain: {
    flex: 1
  },
  medName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  medSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeOk: {
    backgroundColor: '#ecfdf5'
  },
  badgeLow: {
    backgroundColor: '#fffbeb'
  },
  badgeExpired: {
    backgroundColor: '#fef2f2'
  },
  stockBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  textOk: {
    color: '#059669'
  },
  textLow: {
    color: '#d97706'
  },
  textExpired: {
    color: '#dc2626'
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 8,
    marginTop: 10
  },
  expiryText: {
    fontSize: 11,
    color: '#94a3b8'
  },
  refillAlert: {
    fontSize: 11,
    color: '#d97706',
    fontWeight: '700'
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a'
  },
  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a'
  },
  modalClose: {
    fontSize: 16,
    color: '#64748b',
    padding: 4
  },
  modalForm: {
    gap: 12
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    textTransform: 'uppercase'
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a'
  },
  modalSubmit: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  modalSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
