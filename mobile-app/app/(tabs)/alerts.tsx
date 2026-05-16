import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { useAuth } from '../_layout';
import apiClient from '../../utils/apiClient';
import { ShieldAlert, Info } from 'lucide-react-native';
import { useTheme } from '../theme';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants/api';

const API_URL = API_ENDPOINTS.POLICIES;

export default function AlertsScreen() {
  const { userMobile } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    // We mock notifications based on policies for now since backend /notifications doesn't exist
    const fetchAlerts = async () => {
      try {
        const res = await apiClient.get(`${API_URL}/${userMobile}`);
        const data = res.data.data || res.data;
        const policies = data || [];
        
        const now = new Date();
        
        const generatedAlerts: any[] = [];
        
        policies.forEach((p: any) => {
           const diffDays = Math.ceil((new Date(p.expiryDate).getTime() - now.getTime()) / 86400000);
           if (diffDays < 0) {
             generatedAlerts.push({ id: p._id + '-exp', title: 'Policy Expired', desc: `Your ${p.policyType} (${p.policyNumber}) has expired.`, date: new Date(p.expiryDate).toLocaleDateString(), type: 'danger' });
           } else if (diffDays <= 30) {
             generatedAlerts.push({ id: p._id + '-warn', title: 'Renewal Reminder', desc: `Your ${p.policyType} (${p.policyNumber}) expires in ${diffDays} days.`, date: 'Just now', type: 'warning' });
           }
        });

        // Add a generic system alert
        generatedAlerts.push({ id: 'sys-1', title: 'Welcome to SecureFirst', desc: 'Your client portal is now fully activated.', date: 'System', type: 'info' });

        setAlerts(generatedAlerts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userMobile) fetchAlerts();
  }, [userMobile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 50 }} />
        ) : alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <Info size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No new alerts.</Text>
          </View>
        ) : (
          alerts.map(alert => (
            <View key={alert.id} style={styles.alertCard}>
              <View style={[styles.iconBox, 
                alert.type === 'danger' ? { backgroundColor: colors.bgPrimary, borderColor: colors.accentDanger, borderWidth: 1 } : 
                alert.type === 'warning' ? { backgroundColor: colors.bgPrimary, borderColor: colors.accentWarning, borderWidth: 1 } : 
                { backgroundColor: colors.bgPrimary, borderColor: colors.accentSuccess, borderWidth: 1 }
              ]}>
                {alert.type === 'danger' ? <ShieldAlert size={24} color={colors.accentDanger} /> :
                 alert.type === 'warning' ? <ShieldAlert size={24} color={colors.accentWarning} /> :
                 <Info size={24} color={colors.accentSuccess} />}
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.desc}</Text>
                <Text style={styles.alertDate}>{alert.date}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, letterSpacing: -1 },
  alertCard: { flexDirection: 'row', backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  iconBox: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginRight: 18 },
  alertContent: { flex: 1, justifyContent: 'center' },
  alertTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '900', marginBottom: 6 },
  alertDesc: { color: colors.textSecondary, fontSize: 15, marginBottom: 10, lineHeight: 22, fontWeight: '600' },
  alertDate: { color: colors.textSecondary, opacity: 0.7, fontSize: 13, fontWeight: '700' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, marginTop: 16, fontSize: 16, fontWeight: '600' }
});
