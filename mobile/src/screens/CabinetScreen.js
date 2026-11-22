import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
  ScrollView
} from 'react-native';
import mobileClient from '../api/client';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function CabinetScreen({ onNavigateToTab }) {
  const { t, language } = useTranslation();
  const { activeProfile } = useProfile();

  const [cabinets, setCabinets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCabinetId, setSelectedCabinetId] = useState(null);

  // New Cabinet Modal State
  const [showNewCabinetModal, setShowNewCabinetModal] = useState(false);
  const [cabinetName, setCabinetName] = useState('');
  const [cabinetCondition, setCabinetCondition] = useState('');

  // Add Medicine to Cabinet Modal State
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [medName, setMedName] = useState('');
  const [medStrength, setMedStrength] = useState('');
  const [medSalt, setMedSalt] = useState('');
  const [medQuantity, setMedQuantity] = useState('20');
  const [medForm, setMedForm] = useState('tablet');
  const [medCategory, setMedCategory] = useState('Common');
  const [medUsedFor, setMedUsedFor] = useState('');
  const [medCautions, setMedCautions] = useState('');
  const [medSubmitting, setMedSubmitting] = useState(false);

  // Add Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [doctorName, setDoctorName] = useState('');
  const [prescDiagnosis, setPrescDiagnosis] = useState('');
  const [prescNotes, setPrescNotes] = useState('');

  // Revisions Modal State
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);
  const [selectedMedForRevisions, setSelectedMedForRevisions] = useState(null);
  const [revisionsList, setRevisionsList] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  const conditionChips = [
    { label: t('cabinet.conditions.cold'), value: 'Cold' },
    { label: t('cabinet.conditions.fever'), value: 'Fever' },
    { label: t('cabinet.conditions.headache'), value: 'Headache' },
    { label: t('cabinet.conditions.stomach'), value: 'Stomach' },
    { label: t('cabinet.conditions.diabetes'), value: 'Diabetes' },
    { label: t('cabinet.conditions.bp'), value: 'Blood Pressure' },
    { label: t('cabinet.conditions.allergy'), value: 'Allergy' }
  ];

  const fetchCabinets = async () => {
    try {
      const res = await mobileClient.get('/cabinets');
      const list = res.data?.cabinets || res.data?.data || [];
      if (Array.isArray(list)) {
        setCabinets(list);
        if (list.length > 0 && !selectedCabinetId) {
          setSelectedCabinetId(list[0]._id);
        }
      }
    } catch (_err) {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCabinets();
  }, [activeProfile?._id]);

  const handleCreateCabinet = async () => {
    if (!cabinetName.trim()) {
      Alert.alert('Required', 'Please enter a cabinet name or medical condition.');
      return;
    }

    try {
      const res = await mobileClient.post('/cabinets', {
        name: cabinetName.trim(),
        medical_condition: cabinetCondition.trim() || cabinetName.trim(),
        profile_id: activeProfile?._id
      });
      setShowNewCabinetModal(false);
      setCabinetName('');
      setCabinetCondition('');
      await fetchCabinets();
      if (res.data?.cabinet?._id) {
        setSelectedCabinetId(res.data.cabinet._id);
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not create cabinet.');
    }
  };

  const handleAddMedicineToCabinet = async () => {
    if (!medName.trim()) {
      Alert.alert('Required Field', 'Please enter a medicine name.');
      return;
    }

    setMedSubmitting(true);
    try {
      await mobileClient.post('/medicines', {
        name: medName.trim(),
        salt_composition: medSalt.trim() || 'Active Pharmaceutical Formulation',
        strength: medStrength.trim() || 'Standard',
        dosage_form: medForm,
        quantity: parseInt(medQuantity, 10) || 10,
        category: medCategory,
        usedFor: medUsedFor.trim(),
        cautions: medCautions.trim(),
        cabinet_id: selectedCabinetId,
        catalog_id: selectedCabinetId,
        profile_id: activeProfile?._id,
        entered_by_role: 'pharmacist',
        entered_by_label: 'Entered by Pharmacist'
      });

      // Reset form so user can immediately add another medicine to the same cabinet without leaving!
      setMedName('');
      setMedStrength('');
      setMedSalt('');
      setMedQuantity('20');
      setMedUsedFor('');
      setMedCautions('');
      Alert.alert('Medicine Added', `"${medName.trim()}" added to this cabinet. You can add another or close.`);
      await fetchCabinets();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to add medicine.');
    } finally {
      setMedSubmitting(false);
    }
  };

  const handleAddPrescription = async () => {
    if (!doctorName.trim()) {
      Alert.alert('Required', 'Please enter prescribing doctor or clinic.');
      return;
    }
    try {
      await mobileClient.post('/prescriptions', {
        doctor_name: doctorName.trim(),
        diagnosis: prescDiagnosis.trim(),
        notes: prescNotes.trim(),
        cabinet_id: selectedCabinetId,
        profile_id: activeProfile?._id
      });
      setShowPrescriptionModal(false);
      setDoctorName('');
      setPrescDiagnosis('');
      setPrescNotes('');
      Alert.alert('Prescription Attached', 'Doctor prescription record linked to this cabinet.');
      await fetchCabinets();
    } catch (err) {
      Alert.alert('Error', err.message || 'Unable to attach prescription.');
    }
  };

  const handleViewRevisions = async (med) => {
    setSelectedMedForRevisions(med);
    setShowRevisionsModal(true);
    setLoadingRevisions(true);
    try {
      const res = await mobileClient.get(`/medicines/${med._id}/revisions`);
      setRevisionsList(res.data?.revisions || []);
    } catch (_e) {
      setRevisionsList([]);
    } finally {
      setLoadingRevisions(false);
    }
  };

  const activeCabinet = cabinets.find(c => c._id === selectedCabinetId) || cabinets[0];

  return (
    <View style={styles.container}>
      {/* Disclaimer Strip */}
      <View style={styles.disclaimerStrip}>
        <Text style={styles.disclaimerText}>
          ℹ️ {t('legal.section2')}
        </Text>
      </View>

      {/* Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topTitles}>
          <Text style={styles.screenTitle}>{t('cabinet.title')}</Text>
          <Text style={styles.screenSub}>{t('cabinet.subtitle')}</Text>
        </View>
        <TouchableOpacity
          style={styles.newCabBtn}
          onPress={() => setShowNewCabinetModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.newCabBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Cabinets Horizontal Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.cabinetTabsRow}
        contentContainerStyle={styles.cabinetTabsContent}
      >
        {cabinets.map((cab) => {
          const isSelected = activeCabinet?._id === cab._id;
          return (
            <TouchableOpacity
              key={cab._id}
              style={[styles.cabinetTab, isSelected && styles.cabinetTabActive]}
              onPress={() => setSelectedCabinetId(cab._id)}
            >
              <Text style={[styles.cabinetTabText, isSelected && styles.cabinetTabTextActive]}>
                {cab.name}
              </Text>
              <View style={styles.medCountBadge}>
                <Text style={styles.medCountText}>{cab.medicines?.length || cab.medicines_count || 0}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Loading Cabinets...</Text>
        </View>
      ) : !activeCabinet ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🗄️</Text>
          <Text style={styles.emptyTitle}>{t('cabinet.title')}</Text>
          <Text style={styles.emptySub}>{t('cabinet.empty')}</Text>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => setShowNewCabinetModal(true)}
          >
            <Text style={styles.primaryActionText}>{t('cabinet.create')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.mainScroll}
          contentContainerStyle={styles.mainContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCabinets(); }} colors={['#0d9488']} />
          }
        >
          {/* Active Cabinet Banner */}
          <View style={styles.activeCabCard}>
            <View style={styles.cabInfoRow}>
              <View>
                <Text style={styles.activeCabName}>{activeCabinet.name}</Text>
                <Text style={styles.activeCabCondition}>
                  Condition: {activeCabinet.medical_condition || 'General Health'}
                </Text>
              </View>
              {/* Quick Actions inside Cabinet */}
              <View style={styles.cabActions}>
                <TouchableOpacity
                  style={styles.actionBtnOutline}
                  onPress={() => setShowPrescriptionModal(true)}
                >
                  <Text style={styles.actionBtnOutlineText}>+ {t('cabinet.add_prescription')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtnSolid}
                  onPress={() => setShowAddMedModal(true)}
                >
                  <Text style={styles.actionBtnSolidText}>+ {t('cabinet.add_medicine')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stock Summary Line */}
            {activeCabinet.stock_status && (
              <View style={styles.stockSummaryBar}>
                <Text style={styles.stockSummaryText}>
                  📊 {activeCabinet.stock_status.in_stock || 0} in stock • {activeCabinet.stock_status.few_left || 0} few left • {activeCabinet.stock_status.out_of_stock || 0} out
                </Text>
              </View>
            )}
          </View>

          {/* Medicines List inside this Cabinet */}
          <Text style={styles.sectionHeading}>{t('nav.medicines')} ({activeCabinet.medicines?.length || 0})</Text>

          {(!activeCabinet.medicines || activeCabinet.medicines.length === 0) ? (
            <View style={styles.noMedsBox}>
              <Text style={styles.noMedsText}>No medicines in this cabinet yet.</Text>
              <TouchableOpacity
                style={styles.addMedFirstBtn}
                onPress={() => setShowAddMedModal(true)}
              >
                <Text style={styles.addMedFirstBtnText}>+ Add Medicine to {activeCabinet.name}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeCabinet.medicines.map((med) => {
              const isOutOfStock = med.quantity <= 0;
              const isFewLeft = !isOutOfStock && med.quantity <= (med.stock_threshold || 5);

              return (
                <View
                  key={med._id}
                  style={[
                    styles.medCard,
                    isOutOfStock && styles.medCardOut,
                    isFewLeft && styles.medCardFew
                  ]}
                >
                  <View style={styles.medCardTop}>
                    <View style={styles.medTitleGroup}>
                      <Text style={styles.medNameText}>{med.name}</Text>
                      {med.salt_composition ? (
                        <Text style={styles.medSaltText}>{med.salt_composition}</Text>
                      ) : null}
                    </View>

                    {/* Stock Pill Badge */}
                    <View
                      style={[
                        styles.stockBadge,
                        isOutOfStock
                          ? styles.stockBadgeOut
                          : isFewLeft
                            ? styles.stockBadgeFew
                            : styles.stockBadgeIn
                      ]}
                    >
                      <Text
                        style={[
                          styles.stockBadgeText,
                          isOutOfStock
                            ? styles.stockTextOut
                            : isFewLeft
                              ? styles.stockTextFew
                              : styles.stockTextIn
                        ]}
                      >
                        {isOutOfStock
                          ? t('cabinet.out_of_stock')
                          : isFewLeft
                            ? `${t('cabinet.few_left')} (${med.quantity})`
                            : `${t('cabinet.in_stock')} (${med.quantity})`}
                      </Text>
                    </View>
                  </View>

                  {/* Warning Badge: "Check This" with Buy Button */}
                  {(isOutOfStock || isFewLeft) && (
                    <View style={styles.checkThisWarning}>
                      <Text style={styles.checkThisLabel}>⚠️ {t('cabinet.check_this')}: Needs Refill</Text>
                      <TouchableOpacity
                        style={styles.refillBtn}
                        onPress={() => onNavigateToTab && onNavigateToTab('nearby')}
                      >
                        <Text style={styles.refillBtnText}>🛒 {t('cabinet.refill')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Purpose & Cautions */}
                  {med.usedFor ? (
                    <Text style={styles.medUsedFor}>
                      <Text style={styles.usedForBold}>Used for: </Text>{med.usedFor}
                    </Text>
                  ) : null}
                  {med.cautions ? (
                    <Text style={styles.medCaution}>
                      ⚠️ {med.cautions}
                    </Text>
                  ) : null}

                  {/* Card Bottom: Entry Label & History Button */}
                  <View style={styles.medCardBottom}>
                    <Text style={styles.entryRoleText}>
                      🏷️ {med.entered_by_label || (med.entered_by_role === 'doctor' ? 'Entered by Doctor' : 'Entered by Pharmacist')}
                    </Text>
                    <TouchableOpacity
                      style={styles.historyBtn}
                      onPress={() => handleViewRevisions(med)}
                    >
                      <Text style={styles.historyBtnText}>Audit History 📜</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Modal 1: Create New Cabinet */}
      <Modal
        visible={showNewCabinetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewCabinetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('cabinet.create')}</Text>
              <TouchableOpacity onPress={() => setShowNewCabinetModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('cabinet.name_label')} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Cold & Cough, Blood Pressure"
                value={cabinetName}
                onChangeText={setCabinetName}
              />

              <Text style={styles.inputLabel}>{t('cabinet.quick_conditions')}</Text>
              <View style={styles.chipsRow}>
                {conditionChips.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[
                      styles.chip,
                      cabinetCondition === c.value && styles.chipActive
                    ]}
                    onPress={() => {
                      setCabinetCondition(c.value);
                      if (!cabinetName) setCabinetName(c.value);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        cabinetCondition === c.value && styles.chipTextActive
                      ]}
                    >
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateCabinet}
              >
                <Text style={styles.modalSubmitBtnText}>Create Cabinet</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Add Medicine to Current Cabinet (Supports adding multiple in a row) */}
      <Modal
        visible={showAddMedModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMedModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Add Medicine ({activeCabinet?.name})</Text>
              <TouchableOpacity onPress={() => setShowAddMedModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>{t('fields.name')} *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dolo 650, Augmentin"
                value={medName}
                onChangeText={setMedName}
              />

              <Text style={styles.inputLabel}>{t('fields.salt_composition')}</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Paracetamol IP 650mg"
                value={medSalt}
                onChangeText={setMedSalt}
              />

              <View style={styles.formRow}>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Strength</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 500mg"
                    value={medStrength}
                    onChangeText={setMedStrength}
                  />
                </View>
                <View style={styles.formCol}>
                  <Text style={styles.inputLabel}>Quantity</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={medQuantity}
                    onChangeText={setMedQuantity}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Used for</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Headache, Fever, Body aches"
                value={medUsedFor}
                onChangeText={setMedUsedFor}
              />

              <Text style={styles.inputLabel}>Caution</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Take after food"
                value={medCautions}
                onChangeText={setMedCautions}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddMedicineToCabinet}
                disabled={medSubmitting}
              >
                {medSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save Medicine &amp; Add Another</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Add Prescription */}
      <Modal
        visible={showPrescriptionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPrescriptionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>+ Add Prescription ({activeCabinet?.name})</Text>
              <TouchableOpacity onPress={() => setShowPrescriptionModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Doctor or Clinic Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Dr. Sharma (Manipal Hospital)"
                value={doctorName}
                onChangeText={setDoctorName}
              />

              <Text style={styles.inputLabel}>Diagnosis / Condition</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Acute Bronchitis"
                value={prescDiagnosis}
                onChangeText={setPrescDiagnosis}
              />

              <Text style={styles.inputLabel}>Instructions / Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Complete 5 days course"
                value={prescNotes}
                onChangeText={setPrescNotes}
              />

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddPrescription}
              >
                <Text style={styles.modalSubmitBtnText}>Attach Prescription</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal 4: Audit & Revision History (Feature 4) */}
      <Modal
        visible={showRevisionsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRevisionsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Audit History: {selectedMedForRevisions?.name}</Text>
              <TouchableOpacity onPress={() => setShowRevisionsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.immutableBanner}>
              <Text style={styles.immutableBannerText}>
                🔒 {t('history.immutable_note')}
              </Text>
            </View>

            {loadingRevisions ? (
              <ActivityIndicator size="small" color="#0d9488" style={{ margin: 20 }} />
            ) : (
              <ScrollView style={styles.revisionsList}>
                {revisionsList.map((rev) => (
                  <View key={rev.revision_number} style={styles.revCard}>
                    <View style={styles.revHeader}>
                      <Text style={styles.revNum}>Revision {rev.revision_number}</Text>
                      <Text style={styles.revAction}>{rev.action_label}</Text>
                    </View>
                    <Text style={styles.revEditor}>
                      Editor: {rev.editor_name || rev.editor_role?.toUpperCase()}
                    </Text>
                    <Text style={styles.revStamp}>
                      📅 {new Date(rev.audit_stamp?.timestamp || rev.created_at).toLocaleString()}
                    </Text>
                    <Text style={styles.revLocation}>
                      📍 {rev.audit_stamp?.location_name || t('history.location_not_shared')}
                    </Text>
                    {rev.changed_fields && (
                      <Text style={styles.revChanges}>
                        Changed: {rev.changed_fields.join(', ')}
                      </Text>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
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
  disclaimerStrip: {
    backgroundColor: '#fef3c7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a'
  },
  disclaimerText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 14
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  topTitles: {
    flex: 1
  },
  screenTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a'
  },
  screenSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  newCabBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  newCabBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  cabinetTabsRow: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    maxHeight: 46
  },
  cabinetTabsContent: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  cabinetTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8
  },
  cabinetTabActive: {
    backgroundColor: '#0d9488'
  },
  cabinetTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569'
  },
  cabinetTabTextActive: {
    color: '#ffffff'
  },
  medCountBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 6
  },
  medCountText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155'
  },
  mainScroll: {
    flex: 1
  },
  mainContent: {
    padding: 12
  },
  activeCabCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14
  },
  cabInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  activeCabName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a'
  },
  activeCabCondition: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  cabActions: {
    flexDirection: 'row',
    gap: 6
  },
  actionBtnOutline: {
    borderWidth: 1,
    borderColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  actionBtnOutlineText: {
    color: '#0d9488',
    fontSize: 10,
    fontWeight: '700'
  },
  actionBtnSolid: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6
  },
  actionBtnSolidText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  stockSummaryBar: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  stockSummaryText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569'
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8
  },
  noMedsBox: {
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  noMedsText: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 10
  },
  addMedFirstBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  addMedFirstBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12
  },
  medCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10
  },
  medCardOut: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffdfd'
  },
  medCardFew: {
    borderColor: '#fcd34d',
    backgroundColor: '#fffdfa'
  },
  medCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  medTitleGroup: {
    flex: 1,
    marginRight: 8
  },
  medNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  medSaltText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  stockBadgeIn: {
    backgroundColor: '#dcfce7'
  },
  stockBadgeFew: {
    backgroundColor: '#fef3c7'
  },
  stockBadgeOut: {
    backgroundColor: '#fee2e2'
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '700'
  },
  stockTextIn: {
    color: '#166534'
  },
  stockTextFew: {
    color: '#92400e'
  },
  stockTextOut: {
    color: '#991b1b'
  },
  checkThisWarning: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8
  },
  checkThisLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#991b1b'
  },
  refillBtn: {
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  refillBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  },
  medUsedFor: {
    fontSize: 12,
    color: '#475569',
    marginTop: 6
  },
  usedForBold: {
    fontWeight: '600',
    color: '#1e293b'
  },
  medCaution: {
    fontSize: 11,
    color: '#d97706',
    marginTop: 4
  },
  medCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9'
  },
  entryRoleText: {
    fontSize: 10,
    color: '#64748b'
  },
  historyBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6
  },
  historyBtnText: {
    fontSize: 11,
    color: '#0d9488',
    fontWeight: '600'
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
    fontSize: 15,
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
    paddingHorizontal: 10,
    height: 38,
    fontSize: 13,
    color: '#0f172a'
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  formRow: {
    flexDirection: 'row',
    gap: 8
  },
  formCol: {
    flex: 1
  },
  modalSubmitBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12
  },
  modalSubmitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  },
  immutableBanner: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10
  },
  immutableBannerText: {
    fontSize: 10,
    color: '#0d9488',
    fontWeight: '600'
  },
  revisionsList: {
    maxHeight: 300
  },
  revCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  revHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  revNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a'
  },
  revAction: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0d9488'
  },
  revEditor: {
    fontSize: 11,
    color: '#334155'
  },
  revStamp: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  revLocation: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2
  },
  revChanges: {
    fontSize: 10,
    color: '#b45309',
    marginTop: 4
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  emptySub: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16
  },
  primaryActionButton: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  primaryActionText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13
  }
});
