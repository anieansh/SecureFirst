import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Bell, AlertTriangle, CheckCircle, TrendingUp, Mail } from 'lucide-react-native';
import { useTheme } from '../theme';

export default function NotificationsScreen() {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [prefs, setPrefs] = useState({
    renewalReminders: true,
    expiryAlerts: true,
    newPolicyConfirmation: true,
    promotionalOffers: false,
    emailNotifications: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const PrefRow = ({ icon, label, subtitle, prefKey, isLast }: any) => (
    <View style={[styles.row, isLast && { borderBottomWidth: 0 }]}>
      <View style={styles.rowLeft}>
        <View style={styles.iconWrap}>{icon}</View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={prefs[prefKey as keyof typeof prefs]}
        onValueChange={() => toggle(prefKey)}
        trackColor={{ false: colors.borderLight, true: colors.accentGold }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Preferences</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionLabel}>Policy Alerts</Text>
        <View style={styles.card}>
          <PrefRow icon={<AlertTriangle size={20} color={colors.accentWarning} />} label="Renewal Reminders" subtitle="15 days before expiry" prefKey="renewalReminders" />
          <PrefRow icon={<Bell size={20} color={colors.accentDanger} />} label="Expiry Alerts" subtitle="On the day of expiry" prefKey="expiryAlerts" />
          <PrefRow icon={<CheckCircle size={20} color={colors.accentSuccess} />} label="Policy Confirmation" subtitle="When a new policy is added" prefKey="newPolicyConfirmation" isLast />
        </View>

        <Text style={styles.sectionLabel}>Marketing</Text>
        <View style={styles.card}>
          <PrefRow icon={<TrendingUp size={20} color={colors.accentGold} />} label="Promotional Offers" subtitle="Deals and new products" prefKey="promotionalOffers" />
          <PrefRow icon={<Mail size={20} color={colors.textSecondary} />} label="Email Notifications" subtitle="Receive updates by email" prefKey="emailNotifications" isLast />
        </View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { padding: 10, backgroundColor: colors.bgPrimary, borderRadius: 16 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: colors.textPrimary },
  content: { padding: 20, paddingBottom: 60 },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 20 },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.bgPrimary, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  rowLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  rowSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
