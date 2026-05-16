import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, useColorScheme, KeyboardAvoidingView,
  Platform, ScrollView, Animated
} from 'react-native';
import { ShieldCheck, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import { auth, app, firebase } from '../utils/firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import apiClient from '../utils/apiClient';

import { API_ENDPOINTS } from '../constants/api';

const AUTH_URL = API_ENDPOINTS.AUTH;


const firebaseConfig = {
  apiKey: "AIzaSyCYLhQ8E8Ij1Hgz-KNkToYOwHooneM9rE0",
  authDomain: "first-4b330.firebaseapp.com",
  projectId: "first-4b330",
  storageBucket: "first-4b330.firebasestorage.app",
  messagingSenderId: "73782412414",
  appId: "1:73782412414:android:8edd2195f308b50f02c42f"
};

export default function LoginScreen() {
  const { setConfirmationObj, token } = useAuth();
  const scheme = useColorScheme();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Auto-redirect if already logged in
  useEffect(() => {
    if (token) {
      router.replace('/(tabs)/home');
    }
  }, [token]);

  const handleSendOtp = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!recaptchaVerifier.current) {
      setError('Recaptcha verifier not initialized');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Check if user is new
      const res = await apiClient.post(`${AUTH_URL}/check-user`, { mobile });
      const isNewUser = !res.data.data.exists;

      const phoneNumber = `+91${mobile}`; // Defaulting to India code
      
      // DEEP DEBUG: Check exact state of Firebase before call
      const modularKey = app.options.apiKey;
      const compatKey = firebase.app().options.apiKey;
      
      console.log("[Auth Debug] Modular API Key:", modularKey ? "FOUND" : "MISSING");
      console.log("[Auth Debug] Compat API Key:", compatKey ? "FOUND" : "MISSING");
      console.log("[Auth Debug] Using Phone Number:", phoneNumber);

      if (!modularKey && !compatKey) {
        throw new Error("Critical: API Key not found in any Firebase instance.");
      }

      // Using the modular SDK as it's more direct with the 'auth' instance
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier.current!);
      setConfirmationObj(confirmation);
      
      // Navigate to OTP screen and pass the mobile number + new user status
      router.push({ pathname: '/otp', params: { mobile, isNewUser: isNewUser.toString() } });
    } catch (err: any) {
      console.error('[Firebase OTP Error]:', err);
      setError(err.response?.data?.error || err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />
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
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.iconWrapper}>
              <ShieldCheck size={56} color={colors.accentGold} />
            </View>
            <Text style={styles.title}>SecureFirst</Text>
            <Text style={styles.subtitle}>Enter your mobile number to login or register</Text>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputRow}>
                <Text style={styles.countryCode}>+91</Text>
                <TextInput
                  style={[styles.input, { flex: 1, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }]}
                  placeholder="Enter 10-digit number"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                  value={mobile}
                  onChangeText={(t) => { setMobile(t); setError(''); }}
                  maxLength={10}
                />
              </View>
            </View>

            <TouchableOpacity style={styles.buttonMain} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Send OTP</Text>
                  <ChevronRight size={22} color="#fff" />
                </View>
              )}
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
  iconWrapper: {
    backgroundColor: colors.bgSecondary, padding: 24, borderRadius: 50,
    marginBottom: 28, shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  title: { fontSize: 38, fontWeight: '900', color: colors.textPrimary, marginBottom: 8, letterSpacing: -1.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, fontWeight: '500', textAlign: 'center' },
  inputContainer: { width: '100%', marginBottom: 20 },
  label: { color: colors.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  input: {
    width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.borderLight,
    borderRadius: 18, padding: 18, color: colors.textPrimary, fontSize: 17, fontWeight: '600',
  },
  inputRow: { flexDirection: 'row', alignItems: 'stretch' },
  countryCode: {
    backgroundColor: colors.bgSecondary, borderWidth: 1.5, borderColor: colors.borderLight,
    borderTopLeftRadius: 18, borderBottomLeftRadius: 18, borderRightWidth: 0,
    paddingHorizontal: 16, paddingVertical: 18,
    color: colors.textPrimary, fontSize: 17, fontWeight: '700',
    textAlignVertical: 'center', includeFontPadding: false, lineHeight: 24,
  },
  buttonMain: {
    width: '100%', backgroundColor: colors.accentGold, padding: 20, borderRadius: 18,
    alignItems: 'center', marginTop: 8,
    shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },
  errorBanner: {
    width: '100%', backgroundColor: `${colors.accentDanger}18`, borderWidth: 1,
    borderColor: `${colors.accentDanger}40`, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  errorText: { color: colors.accentDanger, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});

/*
 * NOTE: The old password-based authentication flow (Login/Register/Reset Password) 
 * has been removed from this file and replaced with Firebase OTP authentication.
 * The original code has been commented out of the build per request.
 * You can find the old code in your git history or in /tmp/old_index.tsx.
 */
