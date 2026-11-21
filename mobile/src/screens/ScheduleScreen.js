import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import mobileClient from '../api/client';

export default function ScheduleScreen() {
  const [scheduleData, setScheduleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchTodaySchedule = async () => {
    try {
      const res = await mobileClient.get('/schedule/today');
      setScheduleData(res.data);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to fetch today doses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodaySchedule();
  }, []);

  const handleTakeDose = async (doseId, medicineName) => {
    try {
      await mobileClient.post(`/doses/${doseId}/take`);
      fetchTodaySchedule();
      Alert.alert('Dose Logged', `Logged ${medicineName}. 1 unit automatically deducted from your medicine cabinet stock.`);
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Unable to log dose taken');
    }
  };

  const handleSkipDose = async (doseId, medicineName) => {
    try {
      await mobileClient.post(`/doses/${doseId}/skip`, { reason: 'Skipped by patient' });
      fetchTodaySchedule();
    } catch (err) {
      Alert.alert('Action Failed', err.message || 'Unable to skip dose');
    }
  };

  const renderDoseItem = ({ item }) => {
    const isPending = item.status === 'pending';
    const isTaken = item.status === 'taken';
    const isSkipped = item.status === 'skipped';

    return (
      <View style={styles.doseCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.medicineName}>{item.medicine?.name || item.name || 'Prescribed Medicine'}</Text>
            <Text style={styles.medicineSub}>
              {item.medicine?.strength || ''} {item.medicine?.dosageForm ? `• ${item.medicine?.dosageForm}` : ''}
            </Text>
          </View>
          <View style={[
            styles.statusBadge,
            isTaken && styles.badgeTaken,
            isSkipped && styles.badgeSkipped,
            item.status === 'missed' && styles.badgeMissed
          ]}>
            <Text style={[
              styles.statusText,
              isTaken && styles.textTaken,
              isSkipped && styles.textSkipped,
              item.status === 'missed' && styles.textMissed
            ]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.timeText}>⏰ Scheduled: {item.scheduledTime || '08:00 AM'}</Text>
          {item.foodInstruction && (
            <Text style={styles.foodText}>🍽️ {item.foodInstruction.replace('_', ' ')}</Text>
          )}
        </View>

        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.skipBtn}
              onPress={() => handleSkipDose(item._id, item.medicine?.name || 'Medicine')}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.takeBtn}
              onPress={() => handleTakeDose(item._id, item.medicine?.name || 'Medicine')}
            >
              <Text style={styles.takeBtnText}>✓ Mark as Taken</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const doses = scheduleData?.doses || [];
  const takenCount = doses.filter(d => d.status === 'taken').length;
  const totalCount = doses.length;

  return (
    <View style={styles.container}>
      {/* Header Metric Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryText}>
          <Text style={styles.summaryTitle}>Today's Medication Tracker</Text>
          <Text style={styles.summarySubtitle}>
            {totalCount === 0 ? 'No doses scheduled for today' : `${takenCount} of ${totalCount} doses completed`}
          </Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressNumber}>
            {totalCount > 0 ? `${Math.round((takenCount / totalCount) * 100)}%` : '100%'}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator size="large" color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={doses}
          keyExtractor={(item) => item._id}
          renderItem={renderDoseItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchTodaySchedule();
              }}
              colors={['#0d9488']}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>You have no pending doses scheduled for today.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  summaryCard: {
    backgroundColor: '#0d9488',
    margin: 16,
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0d9488',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3
  },
  summaryText: {
    flex: 1
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800'
  },
  summarySubtitle: {
    color: '#ccfbf1',
    fontSize: 12,
    marginTop: 4
  },
  progressCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12
  },
  progressNumber: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '800'
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24
  },
  doseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8
  },
  medicineName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a'
  },
  medicineSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8
  },
  badgeTaken: {
    backgroundColor: '#ecfdf5'
  },
  badgeSkipped: {
    backgroundColor: '#fef2f2'
  },
  badgeMissed: {
    backgroundColor: '#fff1f2'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b'
  },
  textTaken: {
    color: '#059669'
  },
  textSkipped: {
    color: '#dc2626'
  },
  textMissed: {
    color: '#e11d48'
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12
  },
  timeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500'
  },
  foodText: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'capitalize'
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 10
  },
  skipBtn: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  skipBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600'
  },
  takeBtn: {
    flex: 2,
    backgroundColor: '#0d9488',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  takeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  errorContainer: {
    margin: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 12
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center'
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
  }
});
