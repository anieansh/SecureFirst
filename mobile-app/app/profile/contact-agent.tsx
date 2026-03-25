import React, { useMemo } from 'react';
import { StyleSheet, Text, View, SafeAreaView, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Phone, MessageCircle, Mail, Clock, MapPin, Globe } from 'lucide-react-native';
import { useTheme } from '../theme';

export default function ContactAgentScreen() {
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleCall = () => {
    Linking.openURL('tel:+918001234567').catch(() => Alert.alert('Unable to open dialer'));
  };

  const handleWhatsApp = () => {
    Linking.openURL('https://wa.me/918001234567?text=Hello, I need help with my policy.').catch(() =>
      Alert.alert('WhatsApp not installed')
    );
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@securefirst.in?subject=Policy Support').catch(() =>
      Alert.alert('Unable to open mail')
    );
  };

  const ContactButton = ({ icon, label, subtitle, color, onPress }: any) => (
    <TouchableOpacity style={styles.contactBtn} onPress={onPress}>
      <View style={[styles.contactIcon, { backgroundColor: color + '22' }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.contactLabel}>{label}</Text>
        <Text style={styles.contactSub}>{subtitle}</Text>
      </View>
      <Text style={[styles.contactAction, { color }]}>→</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Agent</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroBanner}>
          <Phone size={44} color={colors.accentGold} />
          <Text style={styles.heroTitle}>We're here to help</Text>
          <Text style={styles.heroSub}>Reach out to your dedicated SecureFirst agent</Text>
        </View>

        <Text style={styles.sectionLabel}>Get in Touch</Text>
        <View style={styles.card}>
          <ContactButton
            icon={<Phone size={22} color={colors.accentSuccess} />}
            label="Call Us"
            subtitle="+91 800 123 4567"
            color={colors.accentSuccess}
            onPress={handleCall}
          />
          <ContactButton
            icon={<MessageCircle size={22} color="#25D366" />}
            label="WhatsApp"
            subtitle="Chat with an agent"
            color="#25D366"
            onPress={handleWhatsApp}
          />
          <ContactButton
            icon={<Mail size={22} color={colors.accentGold} />}
            label="Email Support"
            subtitle="support@securefirst.in"
            color={colors.accentGold}
            onPress={handleEmail}
          />
        </View>

        <Text style={styles.sectionLabel}>Office Hours</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Clock size={18} color={colors.accentGold} />
            <Text style={styles.infoText}>Monday – Saturday: 9:00 AM – 7:00 PM</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={18} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>Sunday: Closed</Text>
          </View>
          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.accentGold} />
            <Text style={styles.infoText}>123 Insurance Lane, Mumbai, MH 400001</Text>
          </View>
          <View style={styles.infoRow}>
            <Globe size={18} color={colors.accentGold} />
            <Text style={styles.infoText}>www.securefirst.in</Text>
          </View>
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
  heroBanner: { alignItems: 'center', backgroundColor: colors.bgSecondary, borderRadius: 28, padding: 30, marginBottom: 28, borderWidth: 1, borderColor: colors.borderLight },
  heroTitle: { fontSize: 24, fontWeight: '900', color: colors.textPrimary, marginTop: 16, marginBottom: 6 },
  heroSub: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' },
  sectionLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, marginTop: 4 },
  card: { backgroundColor: colors.bgSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden', marginBottom: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: 14 },
  contactIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  contactLabel: { color: colors.textPrimary, fontSize: 16, fontWeight: '800' },
  contactSub: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  contactAction: { fontSize: 22, fontWeight: '900' },
  infoCard: { backgroundColor: colors.bgSecondary, borderRadius: 24, borderWidth: 1, borderColor: colors.borderLight, padding: 20, gap: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  infoText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
});
