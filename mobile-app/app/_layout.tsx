import '@react-native-firebase/app';
import { Stack } from 'expo-router';
import { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, SafeAreaView, Linking, Platform, StyleSheet } from 'react-native';
import { useTheme, ThemeProvider } from './theme';
import { clearBiometricCredentials } from '../utils/biometrics';
import Constants from 'expo-constants';
import axios from 'axios';
import { ShieldAlert } from 'lucide-react-native';

const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001/api/config' : 'http://localhost:5001/api/config';

export const AuthContext = createContext<{
  userMobile: string;
  userEmail: string;
  userName: string;
  confirmationObj: any;
  setConfirmationObj: (obj: any) => void;
  login: (mobile: string, email?: string, name?: string) => void;
  logout: () => void;
}>({
  userMobile: '',
  userEmail: '',
  userName: '',
  confirmationObj: null,
  setConfirmationObj: () => {},
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

// Simple semantic version comparator
const isVersionLower = (current: string, minimum: string) => {
  const currParts = current.split('.').map(Number);
  const minParts = minimum.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const c = currParts[i] || 0;
    const m = minParts[i] || 0;
    if (c < m) return true;
    if (c > m) return false;
  }
  return false;
};

function RootApp() {
  const [userMobile, setUserMobile] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [confirmationObj, setConfirmationObj] = useState<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [needsUpdate, setNeedsUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState('');

  const colors = useTheme();

  useEffect(() => {
    checkAppVersion();
  }, []);

  const checkAppVersion = async () => {
    try {
      const res = await axios.get(`${API_URL}/version`);
      const { minimumAppVersion, updateUrls } = res.data;
      
      const currentVersion = Constants.expoConfig?.version || '1.0.0';
      
      if (isVersionLower(currentVersion, minimumAppVersion)) {
        // App is not live yet, so disable the update popup
        // setNeedsUpdate(true);
        // setUpdateUrl(Platform.OS === 'ios' ? updateUrls.ios : updateUrls.android);
      }
    } catch (error) {
      console.warn("Failed to check app version:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const login = (mobile: string, email?: string, name?: string) => {
    setUserMobile(mobile);
    if (email) setUserEmail(email);
    if (name) setUserName(name);
  };

  const logout = () => {
    setUserMobile('');
    setUserEmail('');
    setUserName('');
    clearBiometricCredentials();
  };

  if (!isLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bgPrimary, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={colors.accentGold} /></View>;
  }

  if (needsUpdate) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgPrimary }}>
        <View style={styles.updateContainer}>
          <ShieldAlert size={80} color={colors.accentDanger} style={{ marginBottom: 24 }} />
          <Text style={[styles.updateTitle, { color: colors.textPrimary }]}>Update Required</Text>
          <Text style={[styles.updateText, { color: colors.textSecondary }]}>
            A new version of SecureFirst is available. You must update to the latest version to continue using the app securely.
          </Text>
          <TouchableOpacity 
            style={[styles.updateBtn, { backgroundColor: colors.accentGold }]}
            onPress={() => Linking.openURL(updateUrl).catch(() => alert('Failed to open app store'))}
          >
            <Text style={styles.updateBtnText}>Update Now</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AuthContext.Provider value={{ userMobile, userEmail, userName, confirmationObj, setConfirmationObj, login, logout }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="otp" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="policy/[id]" />
      </Stack>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  updateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  updateTitle: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center'
  },
  updateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontWeight: '500'
  },
  updateBtn: {
    width: '100%',
    padding: 20,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  updateBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5
  }
});

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  );
}
