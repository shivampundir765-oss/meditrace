import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import mobileClient from '../api/client';

const OCR_SAMPLES = [
  { label: 'Sample: Dolo 650 Strip', text: 'DOLO 650 TABLETS\nBatch No: B240918\nMFG: 05/2024\nEXP: 04/2027\nMfd by: Micro Labs Ltd.' },
  { label: 'Sample: Amoxicillin Strip', text: 'Amoxicillin Trihydrate 500mg\nBATCH: AMX-992\nEXP DATE: 12/2026\nTorrent Pharmaceuticals' },
  { label: 'Sample: Barcode (GTIN-13)', barcode: '8901234567890' }
];

export default function ScanScreen({ onMedicineAdded }) {
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSimulateScan = async (sample) => {
    setLoading(true);
    setScanResult(null);

    try {
      if (sample.barcode) {
        const res = await mobileClient.post('/scan/barcode', { barcode: sample.barcode });
        setScanResult({
          type: 'barcode',
          confidence: res.data.confidence || 0.95,
          medicine: res.data.medicine
        });
      } else {
        const res = await mobileClient.post('/scan/image', { rawText: sample.text });
        setScanResult({
          type: 'ocr',
          confidence: res.data.confidence,
          medicine: res.data.extracted,
          autoFillPayload: res.data.autoFillPayload
        });
      }
    } catch (err) {
      Alert.alert('Scan Failed', err.message || 'Unable to parse medicine strip');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToCabinet = async () => {
    if (!scanResult || !scanResult.medicine?.name) return;

    setSaving(true);
    try {
      await mobileClient.post('/medicines', {
        name: scanResult.medicine.name,
        strength: scanResult.medicine.strength || 'Standard',
        dosageForm: 'tablet',
        quantity: 10,
        expiryDate: scanResult.medicine.expiryDate || new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0],
        batchNumber: scanResult.medicine.batchNumber || undefined,
        manufacturer: scanResult.medicine.manufacturer || undefined
      });

      Alert.alert('Success', `"${scanResult.medicine.name}" has been auto-filled into your medicine cabinet!`);
      setScanResult(null);
      if (onMedicineAdded) onMedicineAdded();
    } catch (err) {
      Alert.alert('Save Failed', err.message || 'Could not save medicine');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Mock Camera Viewfinder */}
      <View style={styles.viewfinder}>
        <View style={styles.targetBox}>
          <Text style={styles.targetCornerTL}>┏</Text>
          <Text style={styles.targetCornerTR}>┓</Text>
          <Text style={styles.targetCornerBL}>┗</Text>
          <Text style={styles.targetCornerBR}>┛</Text>
          <Text style={styles.viewfinderHint}>Align Medicine Strip or Barcode</Text>
        </View>
      </View>

      {/* Quick Scan Triggers */}
      <View style={styles.sampleSection}>
        <Text style={styles.sectionTitle}>Simulate Optical Scanner</Text>
        <Text style={styles.sectionSubtitle}>Select a test strip or barcode to run real-time OCR extraction:</Text>

        <View style={styles.sampleGrid}>
          {OCR_SAMPLES.map((sample, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.sampleBtn}
              onPress={() => handleSimulateScan(sample)}
              disabled={loading}
            >
              <Text style={styles.sampleBtnText}>{sample.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#0d9488" />
          <Text style={styles.loadingText}>Running AI text cleaner & regex OCR extractor...</Text>
        </View>
      )}

      {/* Extracted Details Card */}
      {scanResult && scanResult.medicine && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>Extraction Result</Text>
            <View style={styles.confBadge}>
              <Text style={styles.confText}>
                {Math.round((scanResult.confidence || 0.9) * 100)}% Confidence
              </Text>
            </View>
          </View>

          <View style={styles.resultDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Medicine Name:</Text>
              <Text style={styles.detailValue}>{scanResult.medicine.name}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Strength / Dose:</Text>
              <Text style={styles.detailValue}>{scanResult.medicine.strength || 'Standard'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expiry Date:</Text>
              <Text style={styles.detailValue}>{scanResult.medicine.expiryDate || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Batch / Lot:</Text>
              <Text style={styles.detailValue}>{scanResult.medicine.batchNumber || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer:</Text>
              <Text style={styles.detailValue}>{scanResult.medicine.manufacturer || 'Verified Lab'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={handleSaveToCabinet}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.confirmBtnText}>+ Save to Medicine Cabinet</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8fafc',
    paddingBottom: 32
  },
  viewfinder: {
    height: 180,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden'
  },
  targetBox: {
    width: 220,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  targetCornerTL: { position: 'absolute', top: -10, left: -6, color: '#0d9488', fontSize: 24, fontWeight: 'bold' },
  targetCornerTR: { position: 'absolute', top: -10, right: -6, color: '#0d9488', fontSize: 24, fontWeight: 'bold' },
  targetCornerBL: { position: 'absolute', bottom: -10, left: -6, color: '#0d9488', fontSize: 24, fontWeight: 'bold' },
  targetCornerBR: { position: 'absolute', bottom: -10, right: -6, color: '#0d9488', fontSize: 24, fontWeight: 'bold' },
  viewfinderHint: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  sampleSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 12
  },
  sampleGrid: {
    gap: 8
  },
  sampleBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center'
  },
  sampleBtnText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '700'
  },
  loadingBox: {
    padding: 24,
    alignItems: 'center'
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8
  },
  resultCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 8
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a'
  },
  confBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  confText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700'
  },
  resultDetails: {
    gap: 6,
    marginBottom: 16
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700'
  },
  confirmBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  }
});
