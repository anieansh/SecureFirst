import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useAuth } from '../_layout';
import axios from 'axios';
import { ShieldAlert, ArrowRight, Phone, MessageCircle, Mail } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '../theme';
import { Platform } from 'react-native';
const API_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/policy' : 'http://10.0.2.2:5001/api/policy';

import { getDummyPolicies } from '../dummyData';

export default function HomeScreen() {
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
        console.error('Failed to fetch:', err);
        setPolicies(getDummyPolicies(userMobile));
      } finally {
        setLoading(false);
      }
    };
    if (userMobile) fetchPolicies();
  }, [userMobile]);

  const now = new Date();
  
  const activeCount = policies.filter(p => (new Date(p.expiryDate).getTime() - now.getTime()) > 15 * 86400000).length;
  const expiringCount = policies.filter(p => {
    const diff = new Date(p.expiryDate).getTime() - now.getTime();
    return diff > 0 && diff <= 15 * 86400000;
  }).length;

  const validPolicies = policies.filter(p => new Date(p.expiryDate).getTime() > now.getTime());
  validPolicies.sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  const nearestPolicy = validPolicies[0];

  const nearestDiffDays = nearestPolicy ? Math.ceil((new Date(nearestPolicy.expiryDate).getTime() - now.getTime()) / 86400000) : null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        bounces={true}
        alwaysBounceVertical={true}
      >
        <Text style={styles.greeting}>Hello, {policies[0]?.clientName?.split(' ')[0] || 'Client'}</Text>
        <Text style={styles.subGreeting}>Welcome back to SecureFirst</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 40 }} />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Total</Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{policies.length}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Active</Text>
                <Text style={[styles.statValue, { color: colors.accentSuccess }]}>{activeCount}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Expiring</Text>
                <Text style={[styles.statValue, { color: colors.accentWarning }]}>{expiringCount}</Text>
              </View>
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

            {/* Contact Support */}
            <View style={styles.supportCard}>
              <Text style={styles.supportTitle}>Contact Support</Text>
              <Text style={styles.supportSubtitle}>Mon–Sat, 9am–7pm</Text>
              <View style={styles.supportActions}>
                <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('tel:8343000065').catch(() => Alert.alert('Unable to open dialer'))}>
                  <Phone size={24} color={colors.accentGold} />
                  <Text style={styles.supportBtnText} numberOfLines={1}>Call Us</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('https://wa.me/918343000065?text=Hello, I need help with my policy.').catch(() => Alert.alert('WhatsApp not installed'))}>
                  <MessageCircle size={24} color={colors.accentGold} />
                  <Text style={styles.supportBtnText} numberOfLines={1}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.supportBtn} onPress={() => Linking.openURL('mailto:Support@securefirst.co?subject=Policy Support').catch(() => Alert.alert('Unable to open mail'))}>
                  <Mail size={24} color={colors.accentGold} />
                  <Text style={styles.supportBtnText} numberOfLines={1}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
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
  supportCard: { marginTop: 32, marginBottom: 28, backgroundColor: colors.bgSecondary, borderRadius: 28, padding: 22, borderWidth: 1, borderColor: colors.borderLight },
  supportTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, marginBottom: 4, letterSpacing: -0.5 },
  supportSubtitle: { fontSize: 13, color: colors.textSecondary, fontWeight: '500', marginBottom: 20 },
  supportActions: { flexDirection: 'row', gap: 8 },
  supportBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgPrimary, paddingVertical: 16, paddingHorizontal: 4, borderRadius: 18, borderWidth: 1, borderColor: colors.borderLight },
  supportBtnText: { color: colors.textPrimary, fontSize: 12, fontWeight: '800', textAlign: 'center' }
});
