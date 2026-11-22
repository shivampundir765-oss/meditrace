import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import ProfileSwitcher from './ProfileSwitcher';
import { useTranslation } from '../i18n';

export default function Header({ user, onLogout }) {
  const { language, setLanguage } = useTranslation();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  return (
    <View style={styles.header}>
      <View style={styles.branding}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <View style={styles.titleWrap}>
          <Text style={styles.appName}>
            Medi<Text style={styles.appNameAccent}>trace</Text>
          </Text>
          <Text style={styles.subText}>v3 Health</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        {user && <ProfileSwitcher />}

        <TouchableOpacity onPress={toggleLanguage} style={styles.langBtn}>
          <Text style={styles.langText}>{language === 'en' ? 'HI' : 'EN'}</Text>
        </TouchableOpacity>

        {user && (
          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12
  },
  branding: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 8
  },
  titleWrap: {
    justifyContent: 'center'
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3
  },
  appNameAccent: {
    color: '#0d9488'
  },
  subText: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600'
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  langBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 6
  },
  langText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569'
  },
  logoutBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6
  },
  logoutText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '700'
  }
});
