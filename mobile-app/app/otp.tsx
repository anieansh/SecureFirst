import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, useColorScheme, KeyboardAvoidingView,
  Platform, ScrollView, Animated, Alert
} from 'react-native';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import { auth } from '../utils/firebase';
import axios from 'axios';

import { API_ENDPOINTS, api } from '../constants/api';

const AUTH_URL = API_ENDPOINTS.AUTH;

export default function OTPScreen() {
  const { confirmationObj, login } = useAuth();
  const { mobile, isNewUser } = useLocalSearchParams();
  const scheme = useColorScheme();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!confirmationObj) {
      Alert.alert('Error', 'OTP session expired or invalid. Please try again.', [
        { text: 'OK', onPress: () => router.replace('/') }
      ]);
    }
  }, [confirmationObj]);

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Confirm OTP with Firebase
      await confirmationObj.confirm(otp);

      // 2. Get the Firebase ID Token
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('User not found after verification');
      }
      const idToken = await currentUser.getIdToken();

      // 3. Check if new user
      if (isNewUser === 'true') {
        // Go to signup screen to collect name/email
        router.replace({ pathname: '/signup', params: { mobile, idToken } });
      } else {
        // Existing user, send ID Token to our backend to login
        const res = await api.post(`${AUTH_URL}/firebase-login`, {
          idToken,
          email: '', 
          name: '' 
        });

        if (res.data.success) {
          const { email: userEmail, name: userName, mobile: userMobile } = res.data.user;
          login(userMobile, userEmail, userName);
          router.replace('/(tabs)/home');
        }
      }
    } catch (err: any) {
      console.error('[Verify OTP Error]:', err);
      // Firebase throws specific errors like auth/invalid-verification-code
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code. Please try again.');
      } else {
        setError(err.response?.data?.error || err.message || 'Verification failed. Please try again.');
      }
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
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={loading}>
              <ArrowLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.screenTitle}>Verify OTP</Text>
            <Text style={styles.screenSubtitle}>
              An OTP has been sent to{'\n'}
              <Text style={{ fontWeight: 'bold' }}>+91 {mobile}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="6-digit code"
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad"
                value={otp}
                onChangeText={(t) => { setOtp(t); setError(''); }}
                maxLength={6}
                autoFocus
              />
            </View>

            <TouchableOpacity style={styles.buttonMain} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify & Login</Text>}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  formContainer: { alignItems: 'center', width: '100%' },
  
  backButton: {
    alignSelf: 'flex-start', padding: 12, backgroundColor: colors.bgSecondary,
    borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight,
  },
  
  screenTitle: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginBottom: 8, letterSpacing: -1, alignSelf: 'flex-start' },
  screenSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 32, fontWeight: '500', alignSelf: 'flex-start', lineHeight: 22 },

  inputContainer: { width: '100%', marginBottom: 20 },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: 18, padding: 18, color: colors.textPrimary, fontSize: 17, fontWeight: '600',
  },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '800' },

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
