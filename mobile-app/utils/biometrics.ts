import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const CREDENTIALS_KEY = 'securefirst_biometric_credentials';

/**
 * Check if biometric hardware is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch {
    return false;
  }
}

/**
 * Get the type of biometric available (for display purposes)
 */
export async function getBiometricType(): Promise<string> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Touch ID';
    }
    return 'Biometric';
  } catch {
    return 'Biometric';
  }
}

/**
 * Prompt the user for biometric authentication
 */
export async function authenticateWithBiometrics(promptMessage?: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || 'Authenticate to login',
      fallbackLabel: 'Use Password',
      disableDeviceFallback: true,
    });
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Save credentials to secure storage for biometric login
 */
export async function saveBiometricCredentials(mobile: string, password: string): Promise<boolean> {
  try {
    const data = JSON.stringify({ mobile, password });
    await SecureStore.setItemAsync(CREDENTIALS_KEY, data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieve saved credentials from secure storage
 */
export async function getBiometricCredentials(): Promise<{ mobile: string; password: string } | null> {
  try {
    const data = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}

/**
 * Check if biometric credentials are saved
 */
export async function hasBiometricCredentials(): Promise<boolean> {
  const creds = await getBiometricCredentials();
  return creds !== null;
}

/**
 * Clear biometric credentials (on logout or disable)
 */
export async function clearBiometricCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch {
    // Ignore errors on clear
  }
}
