import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import mobileClient from '../api/client';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function ScheduleScreen({ onNavigateToTab }) {
  const { t, language } = useTranslation();
  const { activeProfile } = useProfile();

  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  // Monthly Calendar Modal State (Feature 5)
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState('2026-11');
  const [calendarHistory, setCalendarHistory] = useState(null);
  const [selectedDayRecord, setSelectedDayRecord] = useState(null);
  const [loadingCalendar, setLoadingCalendar] = useState(false);

  const fetchSchedule = async () => {
    try {
      const schedRes = await mobileClient.get('/schedule/today');
      const sData = schedRes.data?.data || schedRes.data;
      if (sData) setScheduleData(sData);
    } catch (_err) {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [activeProfile?._id]);

  const handleTakeDose = async (doseId, medName) => {
    setProcessingId(doseId);
    try {
      await mobileClient.post(`/doses/${doseId}/take`, { taken_time: new Date() });
      Alert.alert('Dose Logged', `Logged ${medName}. Stock automatically updated.`);
      await fetchSchedule();
    } catch (err) {
      Alert.alert('Failed', err.message || 'Unable to log dose taken.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleOpenCalendar = async (med) => {
    setSelectedMed(med);
    setShowCalendarModal(true);
    await fetchMonthlyCalendar(med._id, calendarMonth);
  };

  const fetchMonthlyCalendar = async (medId, monthStr) => {
    setLoadingCalendar(true);
    setSelectedDayRecord(null);
    try {
      const res = await mobileClient.get(`/medicines/${medId}/dose-history?month=${monthStr}`);
      setCalendarHistory(res.data?.data || res.data || null);
    } catch (_e) {
      setCalendarHistory(null);
    } finally {
      setLoadingCalendar(false);
    }
  };

  const handleMonthChange = (offset) => {
    const [y, m] = calendarMonth.split('-').map(Number);
    let newM = m + offset;
    let newY = y;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    } else if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    const nextMonth = `${newY}-${String(newM).padStart(2, '0')}`;
    setCalendarMonth(nextMonth);
    if (selectedMed?._id) {
      fetchMonthlyCalendar(selectedMed._id, nextMonth);
    }
  };

  const handleMarkLate = async (doseId) => {
    try {
      await mobileClient.post(`/doses/${doseId}/take`, {
        taken_time: new Date(),
        is_late: true
      });
      Alert.alert('Late Dose Recorded', 'Dose marked as taken late and inventory adjusted.');
      if (selectedMed?._id) {
        await fetchMonthlyCalendar(selectedMed._id, calendarMonth);
      }
      await fetchSchedule();
    } catch (err) {
      Alert.alert('Error', err.message || 'Could not mark late dose');
    }
  };

  const doses = scheduleData?.doses || [];

  return (
    <View style={styles.container}>
      {/* Header Disclaimer */}
      <View style={styles.disclaimerStrip}>
        <Text style={styles.disclaimerText}>
          ℹ️ {t('legal.section1')}
        </Text>
      </View>

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchSchedule(); }}
            colors={['#0d9488']}
          />
        }
      >
        {/* Adherence Overview Banner */}
        <View style={styles.overviewBanner}>
          <View style={styles.overviewCol}>
            <Text style={styles.bannerLabel}>{t('schedule.today_doses')}</Text>
            <Text style={styles.bannerVal}>
              {scheduleData?.takenCount || 0} / {scheduleData?.totalDoses || 0}
            </Text>
            <Text style={styles.bannerSub}>
              {scheduleData?.pendingCount || 0} remaining today
            </Text>
          </View>
          <View style={styles.bannerDivider} />
          <View style={styles.overviewCol}>
            <Text style={styles.bannerLabel}>PROFILE</Text>
            <Text style={styles.bannerVal} numberOfLines={1}>
              {activeProfile?.name || 'Self'}
            </Text>
            <Text style={styles.bannerSub}>
              {activeProfile?.relationship?.toUpperCase() || 'OWNER'}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('schedule.today_doses')}</Text>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#0d9488" />
            <Text style={styles.loadingText}>Syncing schedule...</Text>
          </View>
        ) : doses.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🗓️</Text>
            <Text style={styles.emptyTitle}>No Doses Scheduled for Today</Text>
            <Text style={styles.emptySub}>
              Medicines added to your cabinets will automatically appear here with their meal timings.
            </Text>
          </View>
        ) : (
          doses.map((dose) => {
            const isTaken = dose.status === 'taken';
            const medName = dose.medicine?.name || dose.medicine_name || 'Prescription Dose';
            const medStrength = dose.medicine?.strength || '';

            return (
              <View key={dose._id} style={[styles.doseCard, isTaken && styles.doseCardTaken]}>
                <View style={styles.doseInfo}>
                  <TouchableOpacity
                    onPress={() => handleOpenCalendar(dose.medicine || { _id: 'med-01', name: medName })}
                  >
                    <Text style={styles.doseMedName}>
                      {medName} {medStrength ? `(${medStrength})` : ''} 📅
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.doseMeta}>
                    Scheduled: {new Date(dose.scheduled_time || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {dose.food_instruction || 'after_food'}
                  </Text>
                </View>

                {isTaken ? (
                  <View style={styles.takenBadge}>
                    <Text style={styles.takenBadgeText}>✓ Taken</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.takeBtn}
                    onPress={() => handleTakeDose(dose._id, medName)}
                    disabled={processingId === dose._id}
                  >
                    {processingId === dose._id ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.takeBtnText}>{t('schedule.mark_taken')}</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Monthly Adherence Calendar Modal (Feature 5) */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedMed?.name || 'Medicine'} Adherence</Text>
                <Text style={styles.modalSub}>{t('schedule.calendar_view')}</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Month Navigation */}
            <View style={styles.monthNavRow}>
              <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.navBtn}>
                <Text style={styles.navBtnText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.currentMonthText}>{calendarMonth}</Text>
              <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.navBtn}>
                <Text style={styles.navBtnText}>▶</Text>
              </TouchableOpacity>
            </View>

            {/* Adherence Rate & Missed Summary */}
            {calendarHistory?.summary && (
              <View style={styles.summaryRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{t('schedule.adherence_rate')}</Text>
                  <Text style={styles.statVal}>{calendarHistory.summary.adherence_rate || 100}%</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>{t('schedule.total_missed')}</Text>
                  <Text style={[styles.statVal, { color: '#dc2626' }]}>
                    {calendarHistory.summary.total_missed || 0}
                  </Text>
                </View>
              </View>
            )}

            {/* Days Grid */}
            {loadingCalendar ? (
              <ActivityIndicator size="small" color="#0d9488" style={{ margin: 20 }} />
            ) : (
              <ScrollView style={styles.calendarBody}>
                <View style={styles.gridWrap}>
                  {(calendarHistory?.days || []).map((day) => {
                    const dayNum = day.date.split('-')[2];
                    const bg =
                      day.status === 'taken'
                        ? '#dcfce7'
                        : day.status === 'missed'
                          ? '#fee2e2'
                          : day.status === 'partly_taken'
                            ? '#fef3c7'
                            : '#f1f5f9';
                    const textColor =
                      day.status === 'taken'
                        ? '#166534'
                        : day.status === 'missed'
                          ? '#991b1b'
                          : day.status === 'partly_taken'
                            ? '#92400e'
                            : '#64748b';

                    return (
                      <TouchableOpacity
                        key={day.date}
                        style={[styles.dayCell, { backgroundColor: bg }]}
                        onPress={() => setSelectedDayRecord(day)}
                      >
                        <Text style={[styles.dayNumText, { color: textColor }]}>
                          {parseInt(dayNum, 10)}
                        </Text>
                        <Text style={[styles.dayStatusDot, { color: textColor }]}>
                          {day.status === 'taken' ? '●' : day.status === 'missed' ? '✕' : '○'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Day Details Drawer */}
                {selectedDayRecord && (
                  <View style={styles.dayDetailsDrawer}>
                    <Text style={styles.dayDetailsDate}>
                      Details for {selectedDayRecord.date} ({selectedDayRecord.status?.toUpperCase()})
                    </Text>
                    {(selectedDayRecord.doses || []).map((d, dIdx) => (
                      <View key={dIdx} style={styles.dayDoseItem}>
                        <Text style={styles.dayDoseTime}>
                          Dose {dIdx + 1}: {new Date(d.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        <Text style={styles.dayDoseStatus}>Status: {d.status}</Text>
                        {d.status === 'missed' && (
                          <TouchableOpacity
                            style={styles.markLateBtn}
                            onPress={() => handleMarkLate(d.dose_id)}
                          >
                            <Text style={styles.markLateBtnText}>{t('schedule.mark_late')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}
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
  mainScroll: {
    flex: 1
  },
  content: {
    padding: 14
  },
  overviewBanner: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16
  },
  overviewCol: {
    flex: 1,
    alignItems: 'center'
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  bannerVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0d9488',
    marginVertical: 2
  },
  bannerSub: {
    fontSize: 10,
    color: '#94a3b8'
  },
  bannerDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10
  },
  doseCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8
  },
  doseCardTaken: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0'
  },
  doseInfo: {
    flex: 1,
    marginRight: 10
  },
  doseMedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a'
  },
  doseMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2
  },
  takenBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8
  },
  takenBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534'
  },
  takeBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8
  },
  takeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff'
  },
  centerContainer: {
    alignItems: 'center',
    padding: 30
  },
  loadingText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8
  },
  emptyBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center'
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
    alignItems: 'flex-start',
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
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1
  },
  modalClose: {
    fontSize: 18,
    color: '#64748b',
    padding: 4
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20
  },
  navBtn: {
    padding: 8
  },
  navBtnText: {
    fontSize: 16,
    color: '#0d9488',
    fontWeight: 'bold'
  },
  currentMonthText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  statLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600'
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0d9488',
    marginTop: 2
  },
  calendarBody: {
    maxHeight: 340
  },
  gridWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'space-between'
  },
  dayCell: {
    width: '13%',
    aspectRatio: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  dayNumText: {
    fontSize: 11,
    fontWeight: '700'
  },
  dayStatusDot: {
    fontSize: 8,
    marginTop: 1
  },
  dayDetailsDrawer: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0'
  },
  dayDetailsDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6
  },
  dayDoseItem: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0'
  },
  dayDoseTime: {
    fontSize: 11,
    color: '#334155'
  },
  dayDoseStatus: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1
  },
  markLateBtn: {
    backgroundColor: '#0d9488',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'flex-start'
  },
  markLateBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  }
});
