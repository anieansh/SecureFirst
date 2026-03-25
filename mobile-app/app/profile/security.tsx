import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, ShieldCheck, Fingerprint, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../theme';

export default function SecurityScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [biometrics, setBiometrics] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [showPin, setShowPin] = useState(false);

  const handleChangePin = () => {
    Alert.alert('Change PIN', 'A PIN reset OTP will be sent to your registered mobile number.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send OTP', onPress: () => Alert.alert('OTP Sent', 'Please check your messages.') }
    ]);
  };

  const Row = ({ icon, label, subtitle, value, onToggle }: any) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: colors.borderLight, true: colors.accentGold }} thumbColor="#FFF" />
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
          <Text style={styles.shieldSub}>Last login: Today at 5:30 PM</Text>
        </View>

        <Text style={styles.sectionLabel}>Authentication</Text>
        <View style={styles.card}>
          <Row icon={<Fingerprint size={20} color={colors.accentGold} />} label="Biometric Login" subtitle="Use Face ID or fingerprint" value={biometrics} onToggle={() => setBiometrics(v => !v)} />
          <Row icon={<Lock size={20} color={colors.textSecondary} />} label="Two-Factor Authentication" subtitle="Extra OTP on login" value={twoFactor} onToggle={() => setTwoFactor(v => !v)} />
        </View>

        <Text style={styles.sectionLabel}>PIN Management</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow} onPress={handleChangePin}>
            <View style={styles.rowLeft}>
              <View style={styles.iconWrap}>
                {showPin ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
              </View>
              <View>
                <Text style={styles.rowLabel}>Change PIN</Text>
                <Text style={styles.rowSub}>Reset your 4-digit secure PIN</Text>
              </View>
            </View>
            <Text style={styles.actionLink}>Reset →</Text>
          </TouchableOpacity>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rowSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  actionLink: { color: colors.accentGold, fontWeight: '800', fontSize: 15 },
});
