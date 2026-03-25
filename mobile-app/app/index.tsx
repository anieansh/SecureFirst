import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, SafeAreaView, StatusBar, ActivityIndicator, useColorScheme } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from './_layout';
import { useTheme } from './theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const scheme = useColorScheme();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSendOTP = () => {
    if (mobile.length >= 10) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        setOtpSent(true);
      }, 700);
    } else {
      alert('Please enter a valid 10-digit mobile number.');
    }
  };

  const handleVerifyOTP = () => {
    if (otp === '1234' || otp.length === 4) {
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        login(mobile);
        router.replace('/(tabs)/home'); 
      }, 500);
    } else {
      alert('Invalid OTP. Use 1234');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={scheme === 'dark' ? "light-content" : "dark-content"} />
      <View style={styles.loginContainer}>
        <View style={styles.iconWrapper}>
          <ShieldCheck size={64} color={colors.accentGold} />
        </View>
        <Text style={styles.title}>Secure First</Text>
        <Text style={styles.subtitle}>Client Portal Access</Text>
        
        {!otpSent ? (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter 10-digit number" 
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad" 
                value={mobile} 
                onChangeText={setMobile} 
                maxLength={10} 
              />
            </View>

            <TouchableOpacity style={styles.buttonMain} onPress={handleSendOTP} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.bgPrimary} /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Enter 4-digit OTP" 
                placeholderTextColor={colors.textSecondary}
                keyboardType="number-pad" 
                value={otp} 
                onChangeText={setOtp} 
                maxLength={4} 
              />
            </View>

            <TouchableOpacity style={styles.buttonMain} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.bgPrimary} /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={{ marginTop: 20 }} onPress={handleSendOTP}>
              <Text style={{ color: colors.accentGold, fontSize: 14, fontWeight: '700' }}>Resend OTP</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={{ marginTop: 20 }} onPress={() => setOtpSent(false)}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Change Mobile Number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  loginContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  iconWrapper: { backgroundColor: colors.bgSecondary, padding: 28, borderRadius: 60, marginBottom: 36, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  title: { fontSize: 40, fontWeight: '900', color: colors.textPrimary, marginBottom: 12, letterSpacing: -1.5 },
  subtitle: { fontSize: 18, color: colors.textSecondary, marginBottom: 52, fontWeight: '600' },
  inputContainer: { width: '100%', marginBottom: 32 },
  label: { color: colors.textSecondary, marginBottom: 10, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  input: { width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight, borderRadius: 20, padding: 20, color: colors.textPrimary, fontSize: 20, fontWeight: '700', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  buttonMain: { width: '100%', backgroundColor: colors.accentGold, padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: colors.accentGold, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 8 },
  buttonText: { color: '#ffffff', fontSize: 20, fontWeight: '900', letterSpacing: 0.5 }
});
