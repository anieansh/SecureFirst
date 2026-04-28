import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck, Fingerprint, Lock, Eye, EyeOff, ScanFace, KeyRound } from 'lucide-react-native';
import { useTheme } from '../theme';
import { useAuth } from '../_layout';
import { Platform } from 'react-native';
import axios from 'axios';
import {
  isBiometricAvailable,
  getBiometricType,
  hasBiometricCredentials,
  clearBiometricCredentials,
  saveBiometricCredentials,
} from '../../utils/biometrics';

const AUTH_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/mobile-auth' : 'http://10.0.2.2:5001/api/mobile-auth';

export default function SecurityScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userMobile } = useAuth();

  const [biometrics, setBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');
  const [biometricAvail, setBiometricAvail] = useState(false);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    checkBiometricState();
  }, []);

  const checkBiometricState = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvail(available);
    if (available) {
      const type = await getBiometricType();
      setBiometricType(type);
      const hasCreds = await hasBiometricCredentials();
      setBiometrics(hasCreds);
    }
  };

  const handleBiometricToggle = async () => {
    if (biometrics) {
      // Disable - clear credentials
      Alert.alert(
        'Disable Biometric Login',
        `Are you sure you want to disable ${biometricType}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable',
            style: 'destructive',
            onPress: async () => {
              await clearBiometricCredentials();
              setBiometrics(false);
            }
          }
        ]
      );
    } else {
      // Enable - prompt for password to save
      Alert.prompt(
        'Enable Biometric Login',
        'Enter your password to enable biometric login:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async (password?: string) => {
              if (!password) return;
              try {
                // Verify password first
                const res = await axios.post(`${AUTH_URL}/login`, { mobile: userMobile, password });
                if (res.data.success) {
                  await saveBiometricCredentials(userMobile, password);
                  setBiometrics(true);
                  Alert.alert('Success', `${biometricType} login enabled!`);
                }
              } catch (err: any) {
                Alert.alert('Error', err.response?.data?.error || 'Incorrect password');
              }
            }
          }
        ],
        'secure-text'
      );
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await axios.post(`${AUTH_URL}/change-password`, {
        mobile: userMobile,
        currentPassword,
        newPassword,
      });
      if (res.data.success) {
        // Update biometric credentials if enabled
        if (biometrics) {
          await saveBiometricCredentials(userMobile, newPassword);
        }
        Alert.alert('Success', 'Password changed successfully');
        setShowChangePassword(false);
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const BiometricRow = () => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>
          {biometricType === 'Face ID' ?
            <ScanFace size={20} color={colors.accentGold} /> :
            <Fingerprint size={20} color={colors.accentGold} />
          }
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{biometricType} Login</Text>
          <Text style={styles.rowSub}>Quick & secure authentication</Text>
        </View>
      </View>
      <Switch
        value={biometrics}
        onValueChange={handleBiometricToggle}
        trackColor={{ false: colors.borderLight, true: colors.accentGold }}
        thumbColor="#FFF"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Security</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.shieldBanner}>
          <ShieldCheck size={44} color={colors.accentSuccess} />
          <Text style={styles.shieldText}>Your account is secure</Text>
          <Text style={styles.shieldSub}>Password-protected with encryption</Text>
        </View>

        {biometricAvail && (
          <>
            <Text style={styles.sectionLabel}>Biometric Authentication</Text>
            <View style={styles.card}>
              <BiometricRow />
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Password</Text>
        <View style={styles.card}>
          {!showChangePassword ? (
            <TouchableOpacity style={styles.actionRow} onPress={() => setShowChangePassword(true)}>
              <View style={styles.rowLeft}>
                <View style={styles.iconWrap}>
                  <KeyRound size={20} color={colors.textSecondary} />
                </View>
                <View>
                  <Text style={styles.rowLabel}>Change Password</Text>
                  <Text style={styles.rowSub}>Update your login password</Text>
                </View>
              </View>
              <Text style={styles.actionLink}>Change →</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.changePasswordForm}>
              <Text style={styles.formTitle}>Change Password</Text>

              <View style={styles.formInputWrap}>
                <TextInput
                  style={styles.formInput}
                  placeholder="Current Password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showCurrent}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                />
                <TouchableOpacity style={styles.formEyeBtn} onPress={() => setShowCurrent(v => !v)}>
                  {showCurrent ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>

              <View style={styles.formInputWrap}>
                <TextInput
                  style={styles.formInput}
                  placeholder="New Password (min. 6 chars)"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={!showNew}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.formEyeBtn} onPress={() => setShowNew(v => !v)}>
                  {showNew ? <EyeOff size={18} color={colors.textSecondary} /> : <Eye size={18} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>

              <View style={styles.formActions}>
                <TouchableOpacity
                  style={styles.formCancelBtn}
                  onPress={() => { setShowChangePassword(false); setCurrentPassword(''); setNewPassword(''); }}
                >
                  <Text style={styles.formCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.formSaveBtn} onPress={handleChangePassword} disabled={changingPassword}>
                  {changingPassword ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.formSaveText}>Update</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { padding: 10, backgroundColor: colors.bgPrimary, borderRadius: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  content: { padding: 20, paddingBottom: 60 },
  shieldBanner: { alignItems: 'center', backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 28, marginBottom: 28, borderWidth: 1, borderColor: colors.borderLight },
  shieldText: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginTop: 14, marginBottom: 4 },
  shieldSub: { fontSize: 14, color: colors.textSecondary },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rowSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  actionLink: { color: colors.accentGold, fontWeight: '800', fontSize: 15 },

  // Change password form
  changePasswordForm: { padding: 20 },
  formTitle: { fontSize: 17, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  formInputWrap: { position: 'relative', marginBottom: 12 },
  formInput: {
    backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: 14, padding: 16, paddingRight: 50,
    color: colors.textPrimary, fontSize: 15, fontWeight: '600',
  },
  formEyeBtn: { position: 'absolute', right: 16, top: 16 },
  formActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  formCancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.borderLight,
    alignItems: 'center',
  },
  formCancelText: { color: colors.textSecondary, fontWeight: '700', fontSize: 15 },
  formSaveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14,
    backgroundColor: colors.accentGold, alignItems: 'center',
  },
  formSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
