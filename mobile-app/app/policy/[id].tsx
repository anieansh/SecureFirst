import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../_layout';
import axios from 'axios';
import { ArrowLeft, Download, Clock } from 'lucide-react-native';
import { useTheme } from '../theme';

import { Platform } from 'react-native';
import { API_ENDPOINTS, api } from '../../constants/api';

const API_URL = API_ENDPOINTS.POLICIES;


import { getDummyPolicies } from '../dummyData';

export default function PolicyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { userMobile } = useAuth();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await api.get(`${API_URL}/${userMobile}`);
        let policies = res.data;
        if (!policies || policies.length === 0) policies = getDummyPolicies(userMobile);
        
        const found = policies.find((p: any) => p._id === id);
        if (found) setPolicy(found);
      } catch (err) {
        console.error(err);
        const fb = getDummyPolicies(userMobile).find((p: any) => p._id === id);
        if (fb) setPolicy(fb);
      } finally {
        setLoading(false);
      }
    };
    if (userMobile && id) fetchPolicy();
  }, [userMobile, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!policy) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
        </View>
        <Text style={styles.errorText}>Policy details could not be loaded.</Text>
      </SafeAreaView>
    );
  }

  const due = new Date(policy.expiryDate);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  let status = 'Active';
  let statusColor = colors.accentSuccess;
  
  if (diffDays < 0) {
    status = 'Expired';
    statusColor = colors.accentDanger;
  } else if (diffDays <= 15) {
    status = 'Expiring Soon';
    statusColor = colors.accentWarning;
  }

  const handleDownload = () => {
    alert(`Downloading ${policy.attachedDocument || 'Policy_Document.pdf'}`);
  };

  const handleRenewal = () => {
    alert(`Renewal request sent for ${policy.policyNumber}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policy Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 20 }}>
        
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            <Text style={styles.policyName}>{policy.policyType}</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.policyNumber}>
            {policy.policyType === 'Motor' ? `Vehicle No: ${policy.vehicleNumber || '-'}` : ''}
          </Text>
          <Text style={styles.insurerName}>Insured by {policy.insurer}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>
                {policy.policyType === 'Motor' ? 'Vehicle Number' : 'Sum Insured'}
              </Text>
              <Text style={styles.detailValue}>
                {policy.policyType === 'Motor' ? (policy.vehicleNumber || 'N/A') : `₹${policy.sumInsured?.toLocaleString() || 'N/A'}`}
              </Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Annual Premium</Text>
              <Text style={styles.detailValue}>₹{policy.annualPremium?.toLocaleString() || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity</Text>
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
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRenewal}>
            <Clock size={20} color={colors.bgPrimary} />
            <Text style={styles.primaryBtnText}>Request Renewal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload}>
            <Download size={20} color={colors.accentGold} />
            <Text style={styles.secondaryBtnText}>Download Policy PDF</Text>
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
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  errorText: { color: colors.accentDanger, textAlign: 'center', marginTop: 40, fontSize: 16, fontWeight: '600' },
  topCard: { backgroundColor: colors.bgSecondary, borderRadius: 28, padding: 26, marginBottom: 28, borderWidth: 1, borderColor: colors.borderLight, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6 },
  topCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  policyName: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, flex: 1, letterSpacing: -1 },
  policyNumber: { fontSize: 16, color: colors.textSecondary, marginBottom: 10, fontWeight: '700' },
  insurerName: { fontSize: 16, color: colors.accentGold, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: 'transparent' },
  statusText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 16, letterSpacing: -0.5 },
  detailsGrid: { flexDirection: 'row', gap: 14 },
  detailBox: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight },
  detailLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  actionSection: { marginTop: 14, gap: 16, paddingBottom: 40 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentGold, paddingVertical: 20, borderRadius: 20, gap: 10, shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  primaryBtnText: { color: colors.bgPrimary, fontSize: 18, fontWeight: '900' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary, paddingVertical: 20, borderRadius: 20, borderWidth: 2, borderColor: colors.borderLight, gap: 10 },
  secondaryBtnText: { color: colors.accentGold, fontSize: 18, fontWeight: '800' }
});
