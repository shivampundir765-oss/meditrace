import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import storage from './src/api/storage';

// Components
import DisclaimerBanner from './src/components/DisclaimerBanner';
import Header from './src/components/Header';
import TabBar from './src/components/TabBar';

// Screens
import AuthScreen from './src/screens/AuthScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import CabinetScreen from './src/screens/CabinetScreen';
import ScanScreen from './src/screens/ScanScreen';
import ChemistShopScreen from './src/screens/ChemistShopScreen';
import ProfileScreen from './src/screens/ProfileScreen';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('schedule');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getItem('meditrace_access_token');
      const storedUser = await storage.getItem('meditrace_user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (_e) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await storage.clear();
    setUser(null);
    setActiveTab('schedule');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Mandatory Medical Disclaimer Banner */}
      <DisclaimerBanner />

      {!user ? (
        <AuthScreen onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
      ) : (
        <View style={styles.appContainer}>
          <Header user={user} onLogout={handleLogout} />

          <View style={styles.mainContent}>
            {activeTab === 'schedule' && <ScheduleScreen />}
            {activeTab === 'cabinet' && <CabinetScreen />}
            {activeTab === 'scan' && <ScanScreen onMedicineAdded={() => setActiveTab('cabinet')} />}
            {activeTab === 'shop' && <ChemistShopScreen />}
            {activeTab === 'profile' && <ProfileScreen user={user} onLogout={handleLogout} />}
          </View>

          <TabBar activeTab={activeTab} onSelectTab={setActiveTab} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  appContainer: {
    flex: 1,
    backgroundColor: '#f8fafc'
  },
  mainContent: {
    flex: 1
  }
});
