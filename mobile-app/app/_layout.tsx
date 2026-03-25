import { Stack } from 'expo-router';
import { createContext, useContext, useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useTheme, ThemeProvider } from './theme';

export const AuthContext = createContext<{
  userMobile: string;
  login: (mobile: string) => void;
  logout: () => void;
}>({
  userMobile: '',
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

function RootApp() {
  const [userMobile, setUserMobile] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const colors = useTheme();

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const login = (mobile: string) => setUserMobile(mobile);
  const logout = () => setUserMobile('');

  if (!isLoaded) return <View style={{ flex: 1, backgroundColor: colors.bgPrimary }}><ActivityIndicator size="large" color={colors.accentGold} /></View>;

  return (
    <AuthContext.Provider value={{ userMobile, login, logout }}>
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
