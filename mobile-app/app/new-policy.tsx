import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import axios from 'axios';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/leads' : 'http://10.0.2.2:5001/api/leads';

export default function NewPolicyScreen() {
  const { userMobile } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [policyType, setPolicyType] = useState('Motor'); // Motor, Home, Travel
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!name || !policyType) {
      alert('Please fill in your name and select a policy type.');
      return;
    }
    if (policyType === 'Motor' && !vehicleNumber) {
      alert('Please provide a vehicle number for Motor policies.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(API_URL, {
        name,
        policyType,
        mobileNumber: userMobile,
        vehicleNumber: policyType === 'Motor' ? vehicleNumber : undefined
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const types = ['Motor', 'Home', 'Travel'];

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrapper}>
          <CheckCircle size={80} color={colors.accentSuccess} style={{ marginBottom: 24 }} />
          <Text style={styles.successTitle}>Request Submitted!</Text>
          <Text style={styles.successDesc}>Your lead has been securely routed to our agents. We will contact you at {userMobile} shortly.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.back()}>
             <Text style={styles.primaryBtnText}>Return Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Policy Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Policy Holder Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter full name" 
          placeholderTextColor={colors.textSecondary}
          value={name} 
          onChangeText={setName} 
        />

        <Text style={styles.label}>Interested Policy Type</Text>
        <View style={styles.pillContainer}>
          {types.map(t => (
            <TouchableOpacity 
              key={t} 
              style={[styles.pill, policyType === t && styles.pillActive]} 
              onPress={() => setPolicyType(t)}
            >
              <Text style={[styles.pillText, policyType === t && styles.pillTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {policyType === 'Motor' && (
          <View style={{ marginTop: 24 }}>
            <Text style={styles.label}>Vehicle Number</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. MH02XY9876" 
              placeholderTextColor={colors.textSecondary}
              value={vehicleNumber} 
              onChangeText={setVehicleNumber} 
            />
          </View>
        )}
        
        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.bgPrimary} /> : <Text style={styles.primaryBtnText}>Submit Lead</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { padding: 10, backgroundColor: colors.bgPrimary, borderRadius: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  formContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  label: { color: colors.textSecondary, marginBottom: 12, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  input: { width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight, borderRadius: 20, padding: 20, color: colors.textPrimary, fontSize: 18, fontWeight: '700', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 32 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pill: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight },
  pillActive: { backgroundColor: colors.accentGold, borderColor: colors.accentGold },
  pillText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  pillTextActive: { color: colors.bgPrimary },
  primaryBtn: { width: '100%', backgroundColor: colors.textPrimary, padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  primaryBtnText: { color: colors.bgPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  successWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  successTitle: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  successDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40, fontWeight: '500' }
});
