import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../_layout';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme';

import { Platform } from 'react-native';
const API_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/policy' : 'http://10.0.2.2:5001/api/policy';

import { getDummyPolicies } from '../dummyData';

export default function PoliciesScreen() {
  const { userMobile } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const res = await axios.get(`${API_URL}/${userMobile}`);
        if (res.data && res.data.length > 0) {
          setPolicies(res.data);
        } else {
          setPolicies(getDummyPolicies(userMobile));
        }
      } catch (err) {
        console.error(err);
        setPolicies(getDummyPolicies(userMobile));
      } finally {
        setLoading(false);
      }
    };
    if (userMobile) fetchPolicies();
  }, [userMobile]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Policies</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 50 }} />
        ) : policies.length === 0 ? (
          <View style={styles.emptyState}>
            <ShieldAlert size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No policies found.</Text>
          </View>
        ) : (
          policies.map((policy) => {
            const due = new Date(policy.expiryDate);
            const today = new Date();
            const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

            let status = 'Active';
            let statusStyle = styles.statusActive;
            let statusColor = colors.accentSuccess;
            
            if (diffDays < 0) {
              status = 'Expired';
              statusStyle = styles.statusExpired;
              statusColor = colors.accentDanger;
            } else if (diffDays <= 15) {
              status = 'Expiring Soon';
              statusStyle = styles.statusExpiring;
              statusColor = colors.accentWarning;
            }

            return (
              <TouchableOpacity key={policy._id} style={styles.card} onPress={() => router.push(`/policy/${policy._id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.policyName}>{policy.policyType}</Text>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
                  </View>
                </View>
                <Text style={styles.policyNumber}>
                  {policy.policyType === 'Motor' ? `Vehicle No: ${policy.vehicleNumber || '-'}` : ''}
                </Text>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Issue Date</Text>
                    <Text style={styles.detailValue}>{new Date(policy.issueDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={styles.detailValue}>{new Date(policy.expiryDate).toLocaleDateString()}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  headerTitle: { fontSize: 28, fontWeight: '900', color: colors.textPrimary, letterSpacing: -1 },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 6, borderLeftColor: colors.accentGold, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  policyName: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, flex: 1 },
  policyNumber: { fontSize: 15, color: colors.textSecondary, marginBottom: 20, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: 'transparent' },
  statusActive: { borderColor: colors.accentSuccess },
  statusExpiring: { borderColor: colors.accentWarning },
  statusExpired: { borderColor: colors.accentDanger },
  statusText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailsGrid: { flexDirection: 'row', gap: 12 },
  detailBox: { flex: 1, backgroundColor: colors.bgPrimary, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight },
  detailLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 6, fontWeight: '700', textTransform: 'uppercase' },
  detailValue: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 80 },
  emptyText: { color: colors.textSecondary, marginTop: 16, fontSize: 17, fontWeight: '600' }
});
