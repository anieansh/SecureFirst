import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../_layout';
import apiClient from '../../utils/apiClient';
import { ShieldAlert, ArrowRight, Phone, MessageCircle, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme';
import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants/api';

const API_URL = API_ENDPOINTS.POLICIES;



export default function HomeScreen() {
  const { userMobile, userName } = useAuth();
  const [policies, setPolicies] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFABOpen, setIsFABOpen] = useState(false);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, lRes] = await Promise.all([
          apiClient.get(`${API_ENDPOINTS.POLICIES}/${userMobile}`),
          apiClient.get(`${API_ENDPOINTS.LEADS}/${userMobile}`)
        ]);
        setPolicies(pRes.data.data || pRes.data || []);
        setLeads(lRes.data.data || lRes.data || []);
      } catch (err) {
        console.error('Failed to fetch:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userMobile) fetchData();
  }, [userMobile]);

  const now = new Date();
  
  const activeCount = policies.filter(p => (new Date(p.expiryDate).getTime() - now.getTime()) > 15 * 86400000).length;
  const expiringCount = policies.filter(p => {
    const diff = new Date(p.expiryDate).getTime() - now.getTime();
    return diff > 0 && diff <= 15 * 86400000;
  }).length;
  const expiredCount = policies.filter(p => new Date(p.expiryDate).getTime() <= now.getTime()).length;
  const requestedCount = leads.length; // All leads are requests
  const rejectedCount = leads.filter(l => l.status === 'Rejected').length;

  const validPolicies = policies.filter(p => new Date(p.expiryDate).getTime() > now.getTime());
  validPolicies.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  const nearestPolicy = validPolicies[0];

  const StatCard = ({ label, count, filter, color }: any) => (
    <TouchableOpacity 
      style={styles.statBox} 
      onPress={() => router.push({ pathname: '/policy-list', params: { filter } })}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: color || colors.textPrimary }]}>{count}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Text style={styles.greeting}>Hello, {userName?.split(' ')[0] || 'Client'}</Text>
        <Text style={styles.subGreeting}>Welcome back to SecureFirst</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <StatCard label="Total" count={policies.length} filter="Total" />
              <StatCard label="Active" count={activeCount} filter="Active" color={colors.accentSuccess} />
              <StatCard label="Expiring" count={expiringCount} filter="Expiring" color={colors.accentWarning} />
            </View>

            <View style={styles.statsGrid}>
              <StatCard label="Expired" count={expiredCount} filter="Expired" color={colors.accentDanger} />
              <StatCard label="Requested" count={requestedCount} filter="Requested" color={colors.accentGold} />
              <StatCard label="Rejected" count={rejectedCount} filter="Rejected" color="#888" />
            </View>

            {nearestPolicy && nearestDiffDays !== null && nearestDiffDays <= 30 && (
              <View style={styles.alertRibbon}>
                <ShieldAlert size={28} color={colors.accentDanger} />
                <View style={{ marginLeft: 16, flex: 1 }}>
                  <Text style={styles.alertTitle}>Renewal Recommended</Text>
                  <Text style={styles.alertDesc}>{nearestPolicy.policyType} ({nearestPolicy.policyNumber}) expires in {nearestDiffDays} days</Text>
                </View>
              </View>
            )}

            <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/new-policy')}>
              <Text style={styles.ctaText}>+ Request New Policy</Text>
            </TouchableOpacity>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Policies</Text>
              <TouchableOpacity onPress={() => router.navigate('/(tabs)/policies')}>
                <Text style={styles.viewAll}>View All</Text>
              </TouchableOpacity>
            </View>

            {policies.slice(0, 3).map((policy) => (
              <TouchableOpacity key={policy._id} style={styles.card} onPress={() => router.push(`/policy/${policy._id}`)}>
                <View style={styles.cardHeader}>
                  <Text style={styles.policyName}>{policy.policyType}</Text>
                  <ArrowRight size={20} color={colors.accentGold} />
                </View>
                <Text style={styles.policyNumber}>
                  {policy.policyType === 'Motor' ? `Vehicle No: ${policy.vehicleNumber || '-'}` : policy.insurer || policy.policyType}
                </Text>
              </TouchableOpacity>
            ))}
            
            {policies.length === 0 && (
              <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>No policies found.</Text>
            )}

      </ScrollView>

      {/* Floating Action Button for Support */}
      <View style={styles.fabContainer}>
        {isFABOpen && (
          <View style={styles.fabMenu}>
            <View style={styles.timingBox}>
              <Text style={styles.timingText}>Shop Hours: Mon-Sat, 9am-7pm</Text>
            </View>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('tel:8343000065')}>
              <Phone size={20} color={colors.accentGold} />
              <Text style={styles.menuText}>Call Us</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://wa.me/918343000065')}>
              <MessageCircle size={20} color={colors.accentGold} />
              <Text style={styles.menuText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('mailto:Support@securefirst.co')}>
              <Mail size={20} color={colors.accentGold} />
              <Text style={styles.menuText}>Email</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.fabTrigger} 
          onPress={() => setIsFABOpen(!isFABOpen)}
          activeOpacity={0.8}
        >
          <Phone size={28} color={colors.bgPrimary} />
          <Text style={styles.fabLabel}>Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  greeting: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginTop: 10, letterSpacing: -1 },
  subGreeting: { fontSize: 16, color: colors.textSecondary, marginBottom: 28, fontWeight: '500' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  statBox: { flex: 1, backgroundColor: colors.bgSecondary, paddingVertical: 20, paddingHorizontal: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  statLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 32, fontWeight: '900' },
  alertRibbon: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.bgSecondary, borderWidth: 1, borderColor: colors.accentDanger, borderRadius: 20, padding: 18, marginBottom: 24 },
  alertTitle: { color: colors.accentDanger, fontWeight: '800', fontSize: 16, marginBottom: 4 },
  alertDesc: { color: colors.textSecondary, opacity: 0.9, fontSize: 14, fontWeight: '600' },
  ctaButton: { backgroundColor: colors.textPrimary, padding: 20, borderRadius: 20, alignItems: 'center', marginBottom: 32, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  ctaText: { color: colors.bgPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, letterSpacing: -0.5 },
  viewAll: { color: colors.accentGold, fontSize: 15, fontWeight: '800' },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 22, marginBottom: 14, borderWidth: 1, borderColor: colors.borderLight, borderLeftWidth: 6, borderLeftColor: colors.accentGold, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  policyName: { fontSize: 19, fontWeight: '800', color: colors.textPrimary },
  policyNumber: { fontSize: 15, color: colors.textSecondary, fontWeight: '600' },
  
  // FAB Styles
  fabContainer: { position: 'absolute', bottom: 30, right: 20, alignItems: 'flex-end' },
  fabTrigger: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.accentGold, paddingVertical: 14, paddingHorizontal: 20, borderRadius: 30, shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 12 },
  fabLabel: { color: colors.bgPrimary, fontWeight: '900', fontSize: 16 },
  fabMenu: { backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 12, marginBottom: 15, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.4, shadowRadius: 25, elevation: 15, width: 220 },
  timingBox: { paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight, marginBottom: 8, alignItems: 'center' },
  timingText: { color: colors.textSecondary, fontSize: 12, fontWeight: '700' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 8 },
  menuText: { color: colors.textPrimary, fontWeight: '800', fontSize: 15 },
});
