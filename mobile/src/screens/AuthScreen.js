import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Image } from 'react-native';
import mobileClient from '../api/client';
import storage from '../api/storage';

export default function AuthScreen({ onAuthSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email || !password || (isRegister && !name)) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const res = await mobileClient.post('/auth/register', {
          name,
          email: email.trim().toLowerCase(),
          password,
          role
        });

        const data = res.data;
        await storage.setItem('meditrace_access_token', data.accessToken);
        await storage.setItem('meditrace_refresh_token', data.refreshToken);
        await storage.setItem('meditrace_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      } else {
        const res = await mobileClient.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password
        });

        const data = res.data;
        await storage.setItem('meditrace_access_token', data.accessToken);
        await storage.setItem('meditrace_refresh_token', data.refreshToken);
        await storage.setItem('meditrace_user', JSON.stringify(data.user));
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../../assets/icon.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          {isRegister ? 'Join Meditrace' : 'Welcome to Meditrace'}
        </Text>
        <Text style={styles.subtitle}>
          {isRegister ? 'Create an account to track doses & medicines' : 'Sign in to access your dose schedules'}
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="patient@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Minimum 8 characters"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {isRegister && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Account Role</Text>
            <View style={styles.rolePicker}>
              {['patient', 'doctor', 'retailer'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleOption, role === r && styles.roleOptionActive]}
                  onPress={() => setRole(r)}
                >
                  <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isRegister ? 'Create Account' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggleBtn}
          onPress={() => {
            setIsRegister(!isRegister);
            setError('');
          }}
        >
          <Text style={styles.toggleText}>
            {isRegister
              ? 'Already have an account? Sign In'
              : "Don't have an account? Create One"}
          </Text>
        </TouchableOpacity>

        <View style={styles.demoDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR QUICK DEMO</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.demoLoginBtn}
          onPress={async () => {
            setLoading(true);
            try {
              const res = await mobileClient.post('/auth/login', {
                email: 'alex@meditrace.health',
                password: 'password123'
              });
              const data = res.data;
              await storage.setItem('meditrace_access_token', data.accessToken);
              await storage.setItem('meditrace_refresh_token', data.refreshToken);
              await storage.setItem('meditrace_user', JSON.stringify(data.user));
              onAuthSuccess(data.user);
            } catch (err) {
              setError(err.message || 'Demo login failed');
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.demoLoginBtnText}>⚡ Instant Demo Sign-In (Patient)</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  logoImage: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignSelf: 'center',
    marginBottom: 14
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 16
  },
  errorText: {
    color: '#dc2626',
    fontSize: 12,
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#ffffff',
    color: '#0f172a'
  },
  rolePicker: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4
  },
  roleOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc'
  },
  roleOptionActive: {
    borderColor: '#0d9488',
    backgroundColor: '#f0fdfa'
  },
  roleText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600'
  },
  roleTextActive: {
    color: '#0d9488',
    fontWeight: '700'
  },
  submitBtn: {
    backgroundColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  toggleBtn: {
    marginTop: 16,
    alignItems: 'center'
  },
  toggleText: {
    color: '#0d9488',
    fontSize: 12,
    fontWeight: '600'
  },
  demoDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    gap: 8
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0'
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.8
  },
  demoLoginBtn: {
    backgroundColor: '#f0fdfa',
    borderWidth: 1.5,
    borderColor: '#0d9488',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center'
  },
  demoLoginBtnText: {
    color: '#0d9488',
    fontSize: 13,
    fontWeight: '700'
  }
});
