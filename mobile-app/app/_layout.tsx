import { Stack } from 'expo-router';
import { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme, ThemeProvider } from './theme';
import { clearBiometricCredentials } from '../utils/biometrics';

export const AuthContext = createContext<{
  userMobile: string;
  userEmail: string;
  userName: string;
  login: (mobile: string, email?: string, name?: string) => void;
  logout: () => void;
}>({
  userMobile: '',
  userEmail: '',
  userName: '',
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

function RootApp() {
  const [userMobile, setUserMobile] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const colors = useTheme();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

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

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}><ActivityIndicator size="large" color={colors.accentGold} /></View>;

  return (
    <AuthContext.Provider value={{ userMobile, userEmail, userName, login, logout }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="policy/[id]" />
      </Stack>
    </AuthContext.Provider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootApp />
    </ThemeProvider>
  );
}
