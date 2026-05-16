import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList, Linking } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, ChevronDown, FileText, ExternalLink, Calendar, Shield, Info } from 'lucide-react-native';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import apiClient from '../utils/apiClient';
import { API_ENDPOINTS } from '../constants/api';

export default function PolicyListScreen() {
  const { filter: initialFilter } = useLocalSearchParams();
  const { userMobile } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [filter, setFilter] = useState(initialFilter as string || 'Total');
  const [policies, setPolicies] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  const filters = ['Total', 'Active', 'Expiring', 'Expired', 'Requested', 'Rejected'];

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Policies
      const pRes = await apiClient.get(`${API_ENDPOINTS.POLICIES}/${userMobile}`);
      setPolicies(pRes.data.data || pRes.data || []);

      // Fetch Leads (for Requested/Rejected/etc)
      const lRes = await apiClient.get(`${API_ENDPOINTS.LEADS}/${userMobile}`);
      setLeads(lRes.data.data || lRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userMobile) fetchData();
  }, [userMobile]);

  const filteredData = useMemo(() => {
    const now = new Date();
    
    if (filter === 'Requested') {
      return leads.map(l => ({ ...l, type: 'lead', status: 'Requested' }));
    }
    
    if (filter === 'Rejected') {
      return leads.filter(l => l.status === 'Rejected').map(l => ({ ...l, type: 'lead' }));
    }

    const processedPolicies = policies.map(p => {
      const expiry = new Date(p.expiryDate);
      const diff = expiry.getTime() - now.getTime();
      let status = 'Active';
      if (diff < 0) status = 'Expired';
      else if (diff <= 15 * 86400000) status = 'Expiring';
      return { ...p, status, type: 'policy' };
    });

    if (filter === 'Total') return processedPolicies;
    return processedPolicies.filter(p => p.status === filter);
  }, [policies, leads, filter]);

  const renderItem = ({ item }: { item: any }) => {
    const isPolicy = item.type === 'policy';
    
    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => isPolicy ? router.push(`/policy/${item._id}`) : null}
        disabled={!isPolicy}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeTag}>
            <Text style={styles.typeTagText}>{item.policyType}</Text>
          </View>
          <View style={[styles.statusBadge, styles[`badge${item.status}`]]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>
          {isPolicy ? (item.vehicleNumber || item.policyNumber) : (item.vehicleNumber || 'Policy Request')}
        </Text>
        
        {isPolicy ? (
          <View style={styles.cardFooter}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text style={styles.footerText}>Expires: {new Date(item.expiryDate).toLocaleDateString()}</Text>
          </View>
        ) : (
          <View style={styles.requestedDocs}>
            {item.notes && <Text style={styles.notesText}>{item.notes}</Text>}
            <View style={styles.docRow}>
              {item.rcImagePath ? (
                <TouchableOpacity style={styles.docBtn} onPress={() => Linking.openURL(`https://api.securefirst.co${item.rcImagePath}`)}>
                  <FileText size={14} color={colors.accentGold} />
                  <Text style={styles.docBtnText}>RC Doc</Text>
                </TouchableOpacity>
              ) : <Text style={styles.noDocs}>No RC</Text>}
              
              {item.previousPolicyPath ? (
                <TouchableOpacity style={styles.docBtn} onPress={() => Linking.openURL(`https://api.securefirst.co${item.previousPolicyPath}`)}>
                  <FileText size={14} color={colors.accentGold} />
                  <Text style={styles.docBtnText}>Prev Policy</Text>
                </TouchableOpacity>
              ) : <Text style={styles.noDocs}>No Prev Policy</Text>}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policies Portfolio</Text>
        
        <TouchableOpacity style={styles.filterTrigger} onPress={() => setShowFilterMenu(!showFilterMenu)}>
          <Text style={styles.filterText}>{filter}</Text>
          <ChevronDown size={18} color={colors.accentGold} />
        </TouchableOpacity>
      </View>

      {showFilterMenu && (
        <View style={styles.filterMenu}>
          {filters.map(f => (
            <TouchableOpacity 
              key={f} 
              style={[styles.filterItem, filter === f && styles.filterItemActive]}
              onPress={() => { setFilter(f); setShowFilterMenu(false); }}
            >
              <Text style={[styles.filterItemText, filter === f && styles.filterItemTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.accentGold} />
        </View>
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || index.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Info size={48} color={colors.textSecondary} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>No {filter.toLowerCase()} policies found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight, zIndex: 100 },
  backBtn: { padding: 8, backgroundColor: colors.bgPrimary, borderRadius: 12, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary, flex: 1 },
  filterTrigger: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgPrimary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: colors.borderLight },
  filterText: { color: colors.accentGold, fontWeight: '800', fontSize: 14 },
  filterMenu: { position: 'absolute', top: 80, right: 16, backgroundColor: colors.bgSecondary, borderRadius: 20, padding: 8, borderWidth: 1, borderColor: colors.borderLight, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10, zIndex: 200 },
  filterItem: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  filterItemActive: { backgroundColor: colors.accentGold },
  filterItemText: { color: colors.textPrimary, fontWeight: '700', fontSize: 15 },
  filterItemTextActive: { color: colors.bgPrimary },
  listContent: { padding: 20, paddingBottom: 40 },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.borderLight },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  typeTag: { backgroundColor: colors.bgPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: colors.borderLight },
  typeTagText: { color: colors.accentGold, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  badgeActive: { backgroundColor: 'rgba(52, 199, 89, 0.1)' },
  badgeExpiring: { backgroundColor: 'rgba(255, 159, 10, 0.1)' },
  badgeExpired: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  badgeRequested: { backgroundColor: 'rgba(0, 122, 255, 0.1)' },
  badgeRejected: { backgroundColor: 'rgba(255, 69, 58, 0.1)' },
  cardTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footerText: { color: colors.textSecondary, fontSize: 14, fontWeight: '600' },
  requestedDocs: { marginTop: 8, gap: 12 },
  notesText: { color: colors.textSecondary, fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  docRow: { flexDirection: 'row', gap: 12 },
  docBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.bgPrimary, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.borderLight },
  docBtnText: { color: colors.accentGold, fontSize: 12, fontWeight: '700' },
  noDocs: { color: colors.textSecondary, fontSize: 12, fontStyle: 'italic' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600' }
});
