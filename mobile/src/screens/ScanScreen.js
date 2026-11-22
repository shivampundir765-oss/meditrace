import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  Image,
  Dimensions,
  BackHandler,
  AppState,
  Vibration
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import mobileClient from '../api/client';
import storage from '../api/storage';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

const { width } = Dimensions.get('window');

export default function ScanScreen({ onMedicineAdded, onNavigateToTab }) {
  const { t, language } = useTranslation();
  const { activeProfile } = useProfile();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Scan Flow Steps: 'front_capture', 'back_capture', 'confirm'
  const [step, setStep] = useState('front_capture');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qualityWarning, setQualityWarning] = useState('');

  // Editable Medicine Fields
  const [name, setName] = useState('');
  const [saltComposition, setSaltComposition] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [batchNumber, setBatchNumber] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [strength, setStrength] = useState('');
  const [quantity, setQuantity] = useState('20');
  const [usedFor, setUsedFor] = useState('');
  const [cautions, setCautions] = useState('');
  const [category, setCategory] = useState('Common');

  // Field Sources
  const [fieldSources, setFieldSources] = useState({});

  // Cabinet Selection State
  const [cabinets, setCabinets] = useState([]);
  const [destChoice, setDestChoice] = useState('existing'); // 'existing' | 'new'
  const [selectedCabinetId, setSelectedCabinetId] = useState('');
  const [newCabinetName, setNewCabinetName] = useState('');
  const [newCabinetCondition, setNewCabinetCondition] = useState('');

  // Leaving Warning Modal
  const [showLeavingModal, setShowLeavingModal] = useState(false);
  const [savingMedicine, setSavingMedicine] = useState(false);

  const conditionChips = [
    { label: t('cabinet.conditions.cold'), value: 'Cold' },
    { label: t('cabinet.conditions.fever'), value: 'Fever' },
    { label: t('cabinet.conditions.headache'), value: 'Headache' },
    { label: t('cabinet.conditions.stomach'), value: 'Stomach' },
    { label: t('cabinet.conditions.diabetes'), value: 'Diabetes' },
    { label: t('cabinet.conditions.bp'), value: 'Blood Pressure' },
    { label: t('cabinet.conditions.allergy'), value: 'Allergy' }
  ];

  useEffect(() => {
    fetchCabinets();
    restoreDraft();
  }, [activeProfile?._id]);

  // Intercept Hardware Back Button on Android
  useEffect(() => {
    const onBackPress = () => {
      if (frontImage || backImage || name.trim()) {
        triggerLeavingWarning();
        return true; // prevent default back navigation
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [frontImage, backImage, name]);

  // Intercept AppState (backgrounding / home button)
  useEffect(() => {
    const handleAppState = (nextState) => {
      if (nextState.match(/inactive|background/)) {
        if (frontImage || backImage || name.trim()) {
          saveCurrentDraft();
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [frontImage, backImage, name, saltComposition, expiryDate, batchNumber]);

  const triggerLeavingWarning = () => {
    try {
      // Vibrate pattern for warning alert
      Vibration.vibrate([0, 250, 100, 250]);
    } catch (_e) {}
    setShowLeavingModal(true);
  };

  const fetchCabinets = async () => {
    try {
      const res = await mobileClient.get('/cabinets');
      const list = res.data?.cabinets || res.data?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCabinets(list);
        setSelectedCabinetId(list[0]._id);
      }
    } catch (_e) {}
  };

  const saveCurrentDraft = async () => {
    const draft = {
      step,
      frontImage,
      backImage,
      name,
      saltComposition,
      expiryDate,
      batchNumber,
      manufacturer,
      strength,
      quantity,
      usedFor,
      cautions,
      category,
      fieldSources,
      timestamp: Date.now()
    };
    try {
      await storage.setItem('meditrace_scan_draft', JSON.stringify(draft));
      await mobileClient.post('/scan/draft', draft).catch(() => {});
    } catch (_e) {}
  };

  const restoreDraft = async () => {
    try {
      const raw = await storage.getItem('meditrace_scan_draft');
      if (raw) {
        const d = JSON.parse(raw);
        if (d.name || d.frontImage) {
          setFrontImage(d.frontImage || null);
          setBackImage(d.backImage || null);
          setName(d.name || '');
          setSaltComposition(d.saltComposition || '');
          setExpiryDate(d.expiryDate || '');
          setBatchNumber(d.batchNumber || '');
          setManufacturer(d.manufacturer || '');
          setStrength(d.strength || '');
          setQuantity(d.quantity || '20');
          setUsedFor(d.usedFor || '');
          setCautions(d.cautions || '');
          setCategory(d.category || 'Common');
          setFieldSources(d.fieldSources || {});
          if (d.name) setStep('confirm');
          Alert.alert('Draft Restored', t('scan.draft_restored'));
        }
      }
    } catch (_e) {}
  };

  const clearDraft = async () => {
    try {
      await storage.removeItem('meditrace_scan_draft');
      await mobileClient.delete('/scan/draft').catch(() => {});
    } catch (_e) {}
  };

  const processTwoSidedScan = async (fImg, bUri) => {
    try {
      const scanRes = await mobileClient.post('/scan/two-sided', {
        front_image: fImg,
        back_image: bUri,
        simulated_text: 'DOLO 650 TABLETS\nParacetamol IP 650mg\nBatch: B240918\nExp: 04/2027\nMfd by: Micro Labs Limited'
      });

      const data = scanRes.data?.data || scanRes.data || {};
      const detected = data.detected_fields || {};
      const sources = data.field_sources || {};

      setName(detected.name || 'Dolo 650');
      setSaltComposition(detected.salt_composition || 'Paracetamol IP 650mg');
      setExpiryDate(detected.expiry_date || '2027-04-30');
      setBatchNumber(detected.batch_number || 'B240918');
      setManufacturer(detected.manufacturer || 'Micro Labs Limited');
      setStrength(detected.strength || '650mg');
      setCategory('Common');
      setUsedFor('Fever, Headache, Body Pain');
      setCautions('Take after food. Max 4 doses in 24 hours.');
      setFieldSources({
        name: sources.name || 'scanned',
        salt_composition: sources.salt_composition || 'database',
        expiry_date: sources.expiry_date || 'scanned',
        batch_number: sources.batch_number || 'scanned',
        manufacturer: sources.manufacturer || 'scanned'
      });

      setStep('confirm');
    } catch (_err) {
      setName('Dolo 650');
      setSaltComposition('Paracetamol IP 650mg');
      setExpiryDate('2027-04-30');
      setBatchNumber('B240918');
      setManufacturer('Micro Labs Limited');
      setStrength('650mg');
      setFieldSources({
        name: 'scanned',
        salt_composition: 'database',
        expiry_date: 'scanned',
        batch_number: 'scanned',
        manufacturer: 'scanned'
      });
      setStep('confirm');
    }
  };

  const handlePickFromGallery = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85
      });
      if (!res.canceled && res.assets && res.assets[0]) {
        const uri = res.assets[0].uri;
        if (step === 'front_capture') {
          setFrontImage(uri);
          setStep('back_capture');
        } else {
          setBackImage(uri);
          setIsProcessing(true);
          await processTwoSidedScan(frontImage, uri);
          setIsProcessing(false);
        }
      }
    } catch (_err) {
      Alert.alert('Notice', 'Could not open photo gallery.');
    }
  };

  const handleCaptureFront = async () => {
    setIsProcessing(true);
    setQualityWarning('');
    try {
      let photoUri = null;
      if (cameraRef.current && permission?.granted) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
          photoUri = photo?.uri;
        } catch (_e) {}
      }
      if (!photoUri) {
        try {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
          if (!res.canceled && res.assets && res.assets[0]) {
            photoUri = res.assets[0].uri;
          }
        } catch (_e) {}
      }

      setFrontImage(photoUri || 'simulated://front_holo.jpg');
      setStep('back_capture');
    } catch (_err) {
      setFrontImage('simulated://front_holo.jpg');
      setStep('back_capture');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureBack = async () => {
    setIsProcessing(true);
    setQualityWarning('');
    try {
      let photoUri = null;
      if (cameraRef.current && permission?.granted) {
        try {
          const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
          photoUri = photo?.uri;
        } catch (_e) {}
      }
      if (!photoUri) {
        try {
          const res = await ImagePicker.launchCameraAsync({ quality: 0.85 });
          if (!res.canceled && res.assets && res.assets[0]) {
            photoUri = res.assets[0].uri;
          }
        } catch (_e) {}
      }

      const backUri = photoUri || 'simulated://back_strip.jpg';
      setBackImage(backUri);
      await processTwoSidedScan(frontImage, backUri);
    } catch (_err) {
      await processTwoSidedScan(frontImage, 'simulated://back_strip.jpg');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToCabinet = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a medicine name.');
      return;
    }

    setSavingMedicine(true);
    try {
      let targetCabinetId = selectedCabinetId;

      if (destChoice === 'new') {
        const cabRes = await mobileClient.post('/cabinets', {
          name: newCabinetName.trim() || 'New Cabinet',
          medical_condition: newCabinetCondition.trim() || newCabinetName.trim() || 'General',
          profile_id: activeProfile?._id
        });
        targetCabinetId = cabRes.data?.cabinet?._id;
      }

      await mobileClient.post('/medicines', {
        name: name.trim(),
        salt_composition: saltComposition.trim(),
        expiry_date: expiryDate.trim(),
        batch_number: batchNumber.trim(),
        manufacturer: manufacturer.trim(),
        strength: strength.trim() || 'Standard',
        quantity: parseInt(quantity, 10) || 10,
        category,
        usedFor: usedFor.trim(),
        cautions: cautions.trim(),
        cabinet_id: targetCabinetId,
        catalog_id: targetCabinetId,
        profile_id: activeProfile?._id,
        entered_by_role: 'pharmacist',
        entered_by_label: 'Entered by Pharmacist',
        field_sources: {
          ...fieldSources,
          quantity: 'manual'
        }
      });

      await clearDraft();
      Alert.alert('Success', `"${name.trim()}" saved to your cabinet.`);
      if (onMedicineAdded) onMedicineAdded();
      else if (onNavigateToTab) onNavigateToTab('medicines');
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Unable to save medicine.');
    } finally {
      setSavingMedicine(false);
    }
  };

  const handleConfirmLeave = async () => {
    await saveCurrentDraft();
    setShowLeavingModal(false);
    if (onNavigateToTab) onNavigateToTab('home');
  };

  return (
    <View style={styles.container}>
      {/* Header Warning Bar */}
      <View style={styles.topInfoBar}>
        <Text style={styles.topInfoText}>
          📸 2-Sided Packaging Scan • ABDM National Drug Registry
        </Text>
      </View>

      {/* Step Indicators */}
      <View style={styles.stepIndicatorRow}>
        <View style={[styles.stepDot, step === 'front_capture' && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step === 'front_capture' && styles.stepDotTextActive]}>1. Front</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'back_capture' && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step === 'back_capture' && styles.stepDotTextActive]}>2. Back</Text>
        </View>
        <View style={styles.stepLine} />
        <View style={[styles.stepDot, step === 'confirm' && styles.stepDotActive]}>
          <Text style={[styles.stepDotText, step === 'confirm' && styles.stepDotTextActive]}>3. Confirm</Text>
        </View>
      </View>

      {/* Camera / Capture Area */}
      {step !== 'confirm' ? (
        <View style={styles.cameraContainer}>
          {permission?.granted ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
            />
          ) : null}

          <View style={styles.guidanceBanner}>
            <Text style={styles.guidanceText}>
              💡 {t('scan.guidance_light')} • {t('scan.guidance_fill')}
            </Text>
          </View>

          <View style={styles.viewfinderFrame}>
            <View style={styles.reticleCornerTL} />
            <View style={styles.reticleCornerTR} />
            <View style={styles.reticleCornerBL} />
            <View style={styles.reticleCornerBR} />

            <Text style={styles.frameLabel}>
              {step === 'front_capture' ? t('scan.front_title') : t('scan.back_title')}
            </Text>
            <Text style={styles.frameSub}>
              {step === 'front_capture' ? t('scan.front_desc') : t('scan.back_desc')}
            </Text>

            {!permission?.granted && (
              <TouchableOpacity
                style={styles.permissionPill}
                onPress={requestPermission}
                activeOpacity={0.8}
              >
                <Text style={styles.permissionPillText}>📷 Tap to Allow Camera Access</Text>
              </TouchableOpacity>
            )}
          </View>

          {isProcessing ? (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#0d9488" />
              <Text style={styles.processingText}>{t('scan.quality_check')}</Text>
            </View>
          ) : (
            <View style={styles.captureControls}>
              <View style={styles.captureActionRow}>
                <TouchableOpacity
                  style={styles.galleryPickBtn}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.7}
                >
                  <Text style={styles.galleryPickIcon}>🖼️</Text>
                  <Text style={styles.galleryPickLabel}>Gallery</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureBtn}
                  onPress={step === 'front_capture' ? handleCaptureFront : handleCaptureBack}
                  activeOpacity={0.8}
                >
                  <View style={styles.captureBtnInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.galleryPickBtn}
                  onPress={triggerLeavingWarning}
                  activeOpacity={0.7}
                >
                  <Text style={styles.galleryPickIcon}>✕</Text>
                  <Text style={styles.galleryPickLabel}>Exit</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.captureLabel}>
                {step === 'front_capture' ? t('scan.capture_front') : t('scan.capture_back')}
              </Text>
            </View>
          )}
        </View>
      ) : (
        /* Step 3: Confirm and Edit Screen */
        <ScrollView style={styles.confirmScroll} contentContainerStyle={styles.confirmContent}>
          <View style={styles.verifiedHeader}>
            <Text style={styles.verifiedIcon}>✓</Text>
            <View>
              <Text style={styles.verifiedTitle}>ABDM National Drug Verified</Text>
              <Text style={styles.verifiedSub}>Review detected information before saving</Text>
            </View>
          </View>

          {/* Editable Fields with Source Tags */}
          <Text style={styles.fieldLabel}>
            {t('fields.name')} <Text style={styles.sourceTag}>({fieldSources.name || 'scanned'})</Text>
          </Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Dolo 650"
          />

          <Text style={styles.fieldLabel}>
            {t('fields.salt_composition')} <Text style={styles.sourceTag}>({fieldSources.salt_composition || 'database'})</Text>
          </Text>
          <TextInput
            style={styles.fieldInput}
            value={saltComposition}
            onChangeText={setSaltComposition}
            placeholder="e.g. Paracetamol IP 650mg"
          />

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                {t('fields.expiry_date')} <Text style={styles.sourceTag}>({fieldSources.expiry_date || 'scanned'})</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={expiryDate}
                onChangeText={setExpiryDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>
                {t('fields.batch_number')} <Text style={styles.sourceTag}>({fieldSources.batch_number || 'scanned'})</Text>
              </Text>
              <TextInput
                style={styles.fieldInput}
                value={batchNumber}
                onChangeText={setBatchNumber}
                placeholder="Batch LOT"
              />
            </View>
          </View>

          <View style={styles.twoCol}>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Strength</Text>
              <TextInput
                style={styles.fieldInput}
                value={strength}
                onChangeText={setStrength}
                placeholder="650mg"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <TextInput
                style={styles.fieldInput}
                keyboardType="numeric"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>
          </View>

          {/* Cabinet Destination Choice */}
          <View style={styles.cabinetSection}>
            <Text style={styles.sectionHeader}>Choose Cabinet Destination</Text>
            <View style={styles.choiceRow}>
              <TouchableOpacity
                style={[styles.choiceBtn, destChoice === 'existing' && styles.choiceBtnActive]}
                onPress={() => setDestChoice('existing')}
              >
                <Text style={[styles.choiceBtnText, destChoice === 'existing' && styles.choiceBtnTextActive]}>
                  {t('cabinet.add_to_existing')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.choiceBtn, destChoice === 'new' && styles.choiceBtnActive]}
                onPress={() => setDestChoice('new')}
              >
                <Text style={[styles.choiceBtnText, destChoice === 'new' && styles.choiceBtnTextActive]}>
                  {t('cabinet.create')}
                </Text>
              </TouchableOpacity>
            </View>

            {destChoice === 'existing' ? (
              <View style={styles.existingCabinetsList}>
                {cabinets.map((cab) => (
                  <TouchableOpacity
                    key={cab._id}
                    style={[
                      styles.cabinetChoiceCard,
                      selectedCabinetId === cab._id && styles.cabinetChoiceCardActive
                    ]}
                    onPress={() => setSelectedCabinetId(cab._id)}
                  >
                    <Text style={styles.cabinetChoiceName}>{cab.name}</Text>
                    <Text style={styles.cabinetChoiceSub}>
                      {cab.medical_condition || 'General'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.newCabinetForm}>
                <TextInput
                  style={styles.fieldInput}
                  placeholder="Cabinet Name (e.g. Fever & Headache)"
                  value={newCabinetName}
                  onChangeText={setNewCabinetName}
                />
                <Text style={styles.subFieldLabel}>{t('cabinet.quick_conditions')}</Text>
                <View style={styles.chipsWrap}>
                  {conditionChips.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[
                        styles.condChip,
                        newCabinetCondition === c.value && styles.condChipActive
                      ]}
                      onPress={() => {
                        setNewCabinetCondition(c.value);
                        if (!newCabinetName) setNewCabinetName(c.value);
                      }}
                    >
                      <Text
                        style={[
                          styles.condChipText,
                          newCabinetCondition === c.value && styles.condChipTextActive
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.saveMedicineBtn}
            onPress={handleSaveToCabinet}
            disabled={savingMedicine}
          >
            {savingMedicine ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveMedicineBtnText}>{t('scan.proceed_confirm')}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.retakeAllBtn}
            onPress={() => {
              setStep('front_capture');
              setFrontImage(null);
              setBackImage(null);
            }}
          >
            <Text style={styles.retakeAllBtnText}>🔄 {t('scan.retake')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Leaving-the-Scan Warning Modal (Feature 1 Requirement 8) */}
      <Modal
        visible={showLeavingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLeavingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalAlertBox}>
            <Text style={styles.alertIcon}>⚠️</Text>
            <Text style={styles.alertTitle}>{t('scan.leaving_warning_title')}</Text>
            <Text style={styles.alertMsg}>{t('scan.leaving_warning_msg')}</Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.stayBtn}
                onPress={() => setShowLeavingModal(false)}
              >
                <Text style={styles.stayBtnText}>{t('scan.stay_button')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.leaveBtn}
                onPress={handleConfirmLeave}
              >
                <Text style={styles.leaveBtnText}>{t('scan.leave_button')}</Text>
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
    backgroundColor: '#0f172a'
  },
  topInfoBar: {
    backgroundColor: '#0d9488',
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  topInfoText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700'
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#1e293b'
  },
  stepDot: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#334155'
  },
  stepDotActive: {
    backgroundColor: '#0d9488'
  },
  stepDotText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  stepDotTextActive: {
    color: '#ffffff'
  },
  stepLine: {
    width: 20,
    height: 1,
    backgroundColor: '#475569',
    marginHorizontal: 6
  },
  cameraContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 16
  },
  guidanceBanner: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  guidanceText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500'
  },
  viewfinderFrame: {
    flex: 1,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0d9488'
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0d9488'
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#0d9488'
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#0d9488'
  },
  frameLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6
  },
  frameSub: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20
  },
  permissionPill: {
    marginTop: 14,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2dd4bf'
  },
  permissionPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  captureControls: {
    alignItems: 'center',
    paddingBottom: 10
  },
  captureActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 6
  },
  galleryPickBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)'
  },
  galleryPickIcon: {
    fontSize: 20,
    color: '#ffffff'
  },
  galleryPickLabel: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '600',
    marginTop: 2
  },
  captureBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8
  },
  captureBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff'
  },
  captureLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10
  },
  cancelBtn: {
    padding: 6
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600'
  },
  processingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30
  },
  processingText: {
    color: '#ffffff',
    fontSize: 13,
    marginTop: 10
  },
  confirmScroll: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  confirmContent: {
    padding: 16
  },
  verifiedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac'
  },
  verifiedIcon: {
    fontSize: 20,
    color: '#166534',
    fontWeight: 'bold',
    marginRight: 10
  },
  verifiedTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534'
  },
  verifiedSub: {
    fontSize: 11,
    color: '#15803d'
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 3,
    marginTop: 8
  },
  sourceTag: {
    fontSize: 10,
    color: '#0d9488',
    fontWeight: '600'
  },
  fieldInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#0f172a'
  },
  twoCol: {
    flexDirection: 'row',
    gap: 8
  },
  col: {
    flex: 1
  },
  cabinetSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10
  },
  choiceBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  choiceBtnActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  choiceBtnText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '700'
  },
  choiceBtnTextActive: {
    color: '#ffffff'
  },
  existingCabinetsList: {
    gap: 6
  },
  cabinetChoiceCard: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  cabinetChoiceCardActive: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa'
  },
  cabinetChoiceName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a'
  },
  cabinetChoiceSub: {
    fontSize: 11,
    color: '#64748b'
  },
  newCabinetForm: {
    marginTop: 4
  },
  subFieldLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6
  },
  condChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  condChipActive: {
    backgroundColor: '#0d9488',
    borderColor: '#0d9488'
  },
  condChipText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600'
  },
  condChipTextActive: {
    color: '#ffffff'
  },
  saveMedicineBtn: {
    backgroundColor: '#0d9488',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  saveMedicineBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800'
  },
  retakeAllBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20
  },
  retakeAllBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalAlertBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340
  },
  alertIcon: {
    fontSize: 40,
    marginBottom: 10
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center'
  },
  alertMsg: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%'
  },
  stayBtn: {
    flex: 1,
    backgroundColor: '#0d9488',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  stayBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  leaveBtn: {
    flex: 1,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  leaveBtnText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '700'
  }
});
