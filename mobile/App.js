import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, ActivityIndicator } from 'react-native';
import storage from './src/api/storage';

// Providers
import { I18nProvider } from './src/i18n';
import { ProfileProvider } from './src/context/ProfileContext';

// Components
import DisclaimerBanner from './src/components/DisclaimerBanner';
import Header from './src/components/Header';
import TabBar from './src/components/TabBar';
import ErrorBoundary from './src/components/ErrorBoundary';
import FloatingChatbot from './src/components/FloatingChatbot';

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
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const storedToken = await storage.getItem('meditrace_access_token');
      const storedUser = await storage.getItem('meditrace_user');

      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Auto initialize default demo session for immediate full feature exploration
        const defaultUser = {
          _id: 'user-001',
          name: 'Arjun Rao',
          email: 'arjun@meditrace.health',
          role: 'patient'
        };
        setUser(defaultUser);
        await storage.setItem('meditrace_user', JSON.stringify(defaultUser));
        await storage.setItem('meditrace_access_token', 'demo-jwt-token-v3');
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
    setActiveTab('home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return (
    <I18nProvider>
      <ProfileProvider>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

          {/* Mandatory Medical Disclaimer Banner */}
          <DisclaimerBanner />

          {!user ? (
            <AuthScreen onAuthSuccess={(authenticatedUser) => setUser(authenticatedUser)} />
          ) : (
            <ErrorBoundary>
              <View style={styles.appContainer}>
                <Header user={user} onLogout={handleLogout} />

                <View style={styles.mainContent}>
                  {(activeTab === 'home' || activeTab === 'schedule') && (
                    <ScheduleScreen onNavigateToTab={setActiveTab} />
                  )}
                  {(activeTab === 'medicines' || activeTab === 'cabinet') && (
                    <CabinetScreen onNavigateToTab={setActiveTab} />
                  )}
                  {activeTab === 'scan' && (
                    <ScanScreen
                      onMedicineAdded={() => setActiveTab('medicines')}
                      onNavigateToTab={setActiveTab}
                    />
                  )}
                  {(activeTab === 'nearby' || activeTab === 'shop') && (
                    <ChemistShopScreen />
                  )}
                  {activeTab === 'profile' && (
                    <ProfileScreen user={user} onLogout={handleLogout} />
                  )}
                </View>

                {/* Floating AI Chatbot on all screens */}
                <FloatingChatbot />

                {/* Bottom 5-Tab Bar */}
                <TabBar
                  activeTab={
                    activeTab === 'schedule'
                      ? 'home'
                      : activeTab === 'cabinet'
                        ? 'medicines'
                        : activeTab === 'shop'
                          ? 'nearby'
                          : activeTab
                  }
                  onSelectTab={setActiveTab}
                />
              </View>
            </ErrorBoundary>
          )}
        </SafeAreaView>
      </ProfileProvider>
    </I18nProvider>
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
    backgroundColor: '#f8fafc',
    position: 'relative'
  },
  mainContent: {
    flex: 1
  }
});
