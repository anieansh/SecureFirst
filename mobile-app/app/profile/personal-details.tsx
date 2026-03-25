import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Phone, MapPin, Save } from 'lucide-react-native';
import { useAuth } from '../_layout';
import { useTheme } from '../theme';
import { getDummyPolicies } from '../dummyData';
import axios from 'axios';
import { Platform } from 'react-native';

const API_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/policy' : 'http://10.0.2.2:5001/api/policy';

export default function PersonalDetailsScreen() {
  const { userMobile } = useAuth();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_URL}/${userMobile}`);
        let policies = res.data;
        if (!policies || policies.length === 0) policies = getDummyPolicies(userMobile);
        if (policies.length > 0) {
          setName(policies[0].clientName || '');
          setEmail(policies[0].clientEmail || '');
        }
      } catch {
        const dummy = getDummyPolicies(userMobile);
        if (dummy.length > 0) {
          setName(dummy[0].clientName || '');
          setEmail(dummy[0].clientEmail || '');
        }
      }
    };
    if (userMobile) fetchInfo();
  }, [userMobile]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Saved', 'Your personal details have been updated.');
    }, 800);
  };

  const Field = ({ icon, label, value, setValue, keyboardType = 'default' }: any) => (
    <View style={styles.fieldGroup}>
      <View style={styles.fieldLabel}>
        {icon}
        <Text style={styles.fieldLabelText}>{label}</Text>
      </View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={setValue}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personal Details</Text>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{name.charAt(0).toUpperCase() || 'C'}</Text>
        </View>

        <View style={styles.card}>
          <Field icon={<User size={18} color={colors.accentGold} />} label="Full Name" value={name} setValue={setName} />
          <Field icon={<Phone size={18} color={colors.accentGold} />} label="Mobile Number" value={userMobile || ''} setValue={() => {}} keyboardType="phone-pad" />
          <Field icon={<Mail size={18} color={colors.accentGold} />} label="Email Address" value={email} setValue={setEmail} keyboardType="email-address" />
          <Field icon={<MapPin size={18} color={colors.accentGold} />} label="Address" value={address} setValue={setAddress} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Save size={20} color={colors.bgPrimary} />
          <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
        </TouchableOpacity>
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
  avatarCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.bgSecondary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 28, borderWidth: 2, borderColor: colors.borderLight },
  avatarText: { fontSize: 38, fontWeight: '900', color: colors.accentGold },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.borderLight, marginBottom: 24 },
  fieldGroup: { marginBottom: 20 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabelText: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: colors.bgPrimary, borderWidth: 1, borderColor: colors.borderLight, borderRadius: 16, padding: 16, color: colors.textPrimary, fontSize: 16, fontWeight: '600' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accentGold, paddingVertical: 18, borderRadius: 20, gap: 10 },
  saveBtnText: { color: colors.bgPrimary, fontSize: 18, fontWeight: '900' },
});
