import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView,
  StatusBar, ActivityIndicator, useColorScheme, KeyboardAvoidingView,
  Platform, ScrollView, Alert, Animated
} from 'react-native';
import { ShieldCheck, Eye, EyeOff, ArrowLeft, Fingerprint, ScanFace, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import axios from 'axios';
import {
  isBiometricAvailable,
  getBiometricType,
  authenticateWithBiometrics,
  saveBiometricCredentials,
  getBiometricCredentials,
  hasBiometricCredentials,
} from '../utils/biometrics';

const AUTH_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/mobile-auth' : 'http://10.0.2.2:5001/api/mobile-auth';

type Screen = 'enterMobile' | 'login' | 'register' | 'forgotPassword' | 'resetPassword';

export default function LoginScreen() {
  const { login } = useAuth();
  const scheme = useColorScheme();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Screen state
  const [screen, setScreen] = useState<Screen>('enterMobile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fields
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [hasSavedCreds, setHasSavedCreds] = useState(false);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
      const hasCreds = await hasBiometricCredentials();
      setHasSavedCreds(hasCreds);

      // Auto-prompt biometric if credentials are saved
      if (hasCreds) {
        handleBiometricLogin();
      }
    }
  };

  const animateTransition = (nextScreen: Screen) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setScreen(nextScreen);
      setError('');
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
  };

  const clearFields = () => {
    setPassword('');
    setConfirmPassword('');
    setName('');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowNewPassword(false);
  };

  // ─── Step 1: Check if user exists ────────────────────────────
  const handleCheckUser = async () => {
    if (mobile.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${AUTH_URL}/check-user`, { mobile });
      clearFields();
      if (res.data.exists) {
        animateTransition('login');
      } else {
        // Try to fetch name and email from policy database
        try {
          const POLICY_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/policy' : 'http://10.0.2.2:5001/api/policy';
          const policyRes = await axios.get(`${POLICY_URL}/${mobile}`);
          if (policyRes.data && policyRes.data.length > 0) {
            setName(policyRes.data[0].clientName || 'SecureFirst User');
            if (policyRes.data[0].clientEmail) {
              setEmail(policyRes.data[0].clientEmail);
            }
          } else {
            setName('SecureFirst User');
          }
        } catch (e) {
          setName('SecureFirst User');
        }
        animateTransition('register');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not connect to server');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2a: Login with password ────────────────────────────
  const handleLogin = async () => {
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${AUTH_URL}/login`, { mobile, password });
      if (res.data.success) {
        const { email: userEmail, name: userName } = res.data.user;

        // Offer to enable biometric if available
        if (biometricAvailable) {
          await saveBiometricCredentials(mobile, password);
        }

        login(mobile, userEmail, userName);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2b: Register new user ──────────────────────────────
  const handleRegister = async () => {
    if (!name.trim()) { setError('Please enter your full name'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email address'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${AUTH_URL}/register`, {
        mobile,
        email: email.trim(),
        password,
        name: name.trim()
      });
      if (res.data.success) {
        const { email: userEmail, name: userName } = res.data.user;

        if (biometricAvailable) {
          await saveBiometricCredentials(mobile, password);
        }

        login(mobile, userEmail, userName);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Biometric Login ─────────────────────────────────────────
  const handleBiometricLogin = async () => {
    const success = await authenticateWithBiometrics(`Use ${biometricType} to login`);
    if (!success) return;

    const creds = await getBiometricCredentials();
    if (!creds) {
      setError('No saved credentials found. Please login with password.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${AUTH_URL}/login`, {
        mobile: creds.mobile,
        password: creds.password
      });
      if (res.data.success) {
        const { email: userEmail, name: userName } = res.data.user;
        setMobile(creds.mobile);
        login(creds.mobile, userEmail, userName);
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      setError('Biometric login failed. Please login with password.');
      setHasSavedCreds(false);
    } finally {
      setLoading(false);
    }
  };

  // ─── Forgot Password ─────────────────────────────────────────
  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${AUTH_URL}/forgot-password`, { mobile });
      setMaskedEmail(res.data.maskedEmail || '');
      animateTransition('resetPassword');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset Password ──────────────────────────────────────────
  const handleResetPassword = async () => {
    if (otp.length !== 6) { setError('Please enter the 6-digit OTP'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    setError('');
    try {
      // Verify OTP first
      await axios.post(`${AUTH_URL}/verify-reset-otp`, { mobile, otp });
      // Reset password
      const res = await axios.post(`${AUTH_URL}/reset-password`, { mobile, otp, newPassword });
      if (res.data.success) {
        Alert.alert('Success', 'Password reset successfully. Please login with your new password.');
        clearFields();
        animateTransition('login');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  // ─── Password Strength ───────────────────────────────────────
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { label: '', color: 'transparent', width: 0 };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { label: 'Weak', color: colors.accentDanger, width: 33 };
    if (score <= 3) return { label: 'Medium', color: colors.accentWarning, width: 66 };
    return { label: 'Strong', color: colors.accentSuccess, width: 100 };
  };

  // ═══════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════

  const renderEnterMobile = () => (
    <>
      <View style={styles.iconWrapper}>
        <ShieldCheck size={56} color={colors.accentGold} />
      </View>
      <Text style={styles.title}>SecureFirst</Text>
      <Text style={styles.subtitle}>Enter your mobile number to continue</Text>

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

      <TouchableOpacity style={styles.buttonMain} onPress={handleCheckUser} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Continue</Text>
            <ChevronRight size={22} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {biometricAvailable && hasSavedCreds && (
        <TouchableOpacity style={styles.biometricBtn} onPress={handleBiometricLogin}>
          {biometricType === 'Face ID' ?
            <ScanFace size={28} color={colors.accentGold} /> :
            <Fingerprint size={28} color={colors.accentGold} />
          }
          <Text style={styles.biometricText}>Login with {biometricType}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderLogin = () => (
    <>
      <TouchableOpacity style={styles.backButton} onPress={() => { clearFields(); animateTransition('enterMobile'); }}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Welcome Back</Text>
      <Text style={styles.screenSubtitle}>Enter your password to login</Text>

      <View style={styles.mobileChip}>
        <Text style={styles.mobileChipText}>+91 {mobile}</Text>
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordInputWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Enter your password"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
            {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonMain} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={handleForgotPassword} disabled={loading}>
        <Text style={styles.linkText}>Forgot Password?</Text>
      </TouchableOpacity>

      {biometricAvailable && hasSavedCreds && (
        <TouchableOpacity style={styles.biometricBtnSmall} onPress={handleBiometricLogin}>
          {biometricType === 'Face ID' ?
            <ScanFace size={24} color={colors.accentGold} /> :
            <Fingerprint size={24} color={colors.accentGold} />
          }
          <Text style={styles.biometricTextSmall}>Use {biometricType}</Text>
        </TouchableOpacity>
      )}
    </>
  );

  const renderRegister = () => {
    const strength = getPasswordStrength(password);
    return (
      <>
        <TouchableOpacity style={styles.backButton} onPress={() => { clearFields(); animateTransition('enterMobile'); }}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        <Text style={styles.screenTitle}>Create Account</Text>
        <Text style={styles.screenSubtitle}>Set up your SecureFirst account</Text>

        <View style={styles.mobileChip}>
          <Text style={styles.mobileChipText}>+91 {mobile}</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, { opacity: 0.6 }]}
            placeholder="Name from your policy"
            placeholderTextColor={colors.textSecondary}
            value={name}
            editable={false}
          />
          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8, fontWeight: '500', lineHeight: 18 }}>
            Your name is prefilled from your policy. You can update this in your profile later.
          </Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@email.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={(t) => { setEmail(t); setError(''); }}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Set Password</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Min. 6 characters"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPassword(v => !v)}>
              {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: `${strength.width}%`, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordInputWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textSecondary}
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPassword(v => !v)}>
              {showConfirmPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.buttonMain} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>
      </>
    );
  };

  const renderForgotPassword = () => (
    <>
      <TouchableOpacity style={styles.backButton} onPress={() => { clearFields(); animateTransition('login'); }}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.screenTitle}>Reset Password</Text>
      <Text style={styles.screenSubtitle}>
        An OTP has been sent to{'\n'}{maskedEmail || 'your registered email'}
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
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>New Password</Text>
        <View style={styles.passwordInputWrap}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="Min. 6 characters"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={(t) => { setNewPassword(t); setError(''); }}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowNewPassword(v => !v)}>
            {showNewPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.buttonMain} onPress={handleResetPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={handleForgotPassword} disabled={loading}>
        <Text style={styles.linkText}>Resend OTP</Text>
      </TouchableOpacity>
    </>
  );

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
            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {screen === 'enterMobile' && renderEnterMobile()}
            {screen === 'login' && renderLogin()}
            {screen === 'register' && renderRegister()}
            {(screen === 'forgotPassword' || screen === 'resetPassword') && renderForgotPassword()}
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

  // Header
  iconWrapper: {
    backgroundColor: colors.bgSecondary, padding: 24, borderRadius: 50,
    marginBottom: 28, shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  title: { fontSize: 38, fontWeight: '900', color: colors.textPrimary, marginBottom: 8, letterSpacing: -1.5 },
  subtitle: { fontSize: 16, color: colors.textSecondary, marginBottom: 40, fontWeight: '500', textAlign: 'center' },

  // Screen titles
  screenTitle: { fontSize: 30, fontWeight: '900', color: colors.textPrimary, marginBottom: 8, letterSpacing: -1, alignSelf: 'flex-start' },
  screenSubtitle: { fontSize: 15, color: colors.textSecondary, marginBottom: 24, fontWeight: '500', alignSelf: 'flex-start', lineHeight: 22 },

  // Mobile chip
  mobileChip: {
    backgroundColor: colors.bgSecondary, paddingVertical: 10, paddingHorizontal: 20,
    borderRadius: 30, borderWidth: 1, borderColor: colors.borderLight,
    marginBottom: 28, alignSelf: 'flex-start',
  },
  mobileChipText: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },

  // Back button
  backButton: {
    alignSelf: 'flex-start', padding: 12, backgroundColor: colors.bgSecondary,
    borderRadius: 16, marginBottom: 24, borderWidth: 1, borderColor: colors.borderLight,
  },

  // Inputs
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
  passwordInputWrap: { position: 'relative', width: '100%' },
  passwordInput: { paddingRight: 56 },
  eyeBtn: { position: 'absolute', right: 18, top: 18 },
  otpInput: { textAlign: 'center', fontSize: 24, letterSpacing: 8, fontWeight: '800' },

  // Password strength
  strengthWrap: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 10 },
  strengthBarBg: { flex: 1, height: 4, backgroundColor: colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 12, fontWeight: '700' },

  // Buttons
  buttonMain: {
    width: '100%', backgroundColor: colors.accentGold, padding: 20, borderRadius: 18,
    alignItems: 'center', marginTop: 8,
    shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  buttonText: { color: '#ffffff', fontSize: 18, fontWeight: '900', letterSpacing: 0.3 },

  linkBtn: { marginTop: 20, paddingVertical: 8 },
  linkText: { color: colors.accentGold, fontSize: 15, fontWeight: '700' },

  // Biometric
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 32,
    backgroundColor: colors.bgSecondary, paddingVertical: 18, paddingHorizontal: 32,
    borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight,
  },
  biometricText: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  biometricBtnSmall: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
    paddingVertical: 10, paddingHorizontal: 20,
  },
  biometricTextSmall: { color: colors.accentGold, fontSize: 14, fontWeight: '700' },

  // Error
  errorBanner: {
    width: '100%', backgroundColor: `${colors.accentDanger}18`, borderWidth: 1,
    borderColor: `${colors.accentDanger}40`, borderRadius: 14, padding: 14, marginBottom: 20,
  },
  errorText: { color: colors.accentDanger, fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
