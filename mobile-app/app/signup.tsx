import React, { useState, useMemo } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, useColorScheme, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import axios from 'axios';

import { API_ENDPOINTS, api } from '../constants/api';

const AUTH_URL = API_ENDPOINTS.AUTH;

export default function SignupScreen() {
  const { login } = useAuth();
  const { mobile, idToken } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // Send ID Token to our backend to create user
      const res = await api.post(`${AUTH_URL}/firebase-login`, {
        idToken,
        email: email.trim(), 
        name: name.trim() 
      });

      if (res.data.success) {
        const { email: userEmail, name: userName, mobile: userMobile } = res.data.user;
        login(userMobile, userEmail, userName);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.error('[Signup Error]:', err);
      setError(err.response?.data?.error || err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.screenTitle}>Create Account</Text>
            <Text style={styles.screenSubtitle}>
              You're almost there! Tell us a bit about yourself.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John Doe"
                placeholderTextColor={colors.textSecondary}
                value={name}
                onChangeText={(t) => { setName(t); setError(''); }}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email Address (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="john@example.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(''); }}
              />
            </View>

            <TouchableOpacity style={styles.buttonMain} onPress={handleSignup} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Complete Signup</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  formContainer: { alignItems: 'center', width: '100%' },
  
  screenTitle: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginBottom: 8, letterSpacing: -1, alignSelf: 'flex-start' },
  screenSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 32, fontWeight: '500', alignSelf: 'flex-start', lineHeight: 22 },

  inputContainer: { width: '100%', marginBottom: 20 },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: 18, padding: 18, color: colors.textPrimary, fontSize: 17, fontWeight: '600',
  },

  buttonMain: {
    width: '100%', backgroundColor: colors.accentGold, padding: 20, borderRadius: 18,
    alignItems: 'center', marginTop: 8,
    shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },

  errorBanner: {
    width: '100%', backgroundColor: `${colors.accentDanger}18`, borderWidth: 1,
    borderColor: `${colors.accentDanger}40`, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  errorText: { color: colors.accentDanger, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
