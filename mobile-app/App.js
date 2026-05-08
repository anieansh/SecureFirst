import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Platform
} from 'react-native';
import axios from 'axios';
import { ShieldCheck, CalendarClock, ShieldAlert, LogOut } from 'lucide-react-native';

// For Android emulator replace localhost with 10.0.2.2.
// For physical device, use the local IP of the machine running the backend (e.g., 192.168.x.x).
const API_URL = Platform.OS === 'ios' ? 'http://localhost:5001/api/policy' : 'http://10.0.2.2:5001/api/policy';

export default function App() {
  const [userMobile, setUserMobile] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Dashboard state
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchPolicies = async (mobile) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await axios.get(`${API_URL}/${mobile}`);
      setPolicies(res.data);
    } catch (error) {
      console.error('Fetch error:', error);
      setErrorMsg('Failed to fetch policies. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    if (userMobile.length >= 10) {
      setIsLoggedIn(true);
      fetchPolicies(userMobile);
    } else {
      alert('Please enter a valid 10-digit mobile number.');
    }
  };

  const handleLogout = () => {
    setUserMobile('');
    setPolicies([]);
    setIsLoggedIn(false);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loginContainer}>
          <View style={styles.iconWrapper}>
            <ShieldCheck size={64} color="#1DD3B0" />
          </View>
          <Text style={styles.title}>Secure First</Text>
          <Text style={styles.subtitle}>Client Portal Access</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter 10-digit number"
              placeholderTextColor="#a0aab2"
              keyboardType="phone-pad"
              value={userMobile}
              onChangeText={setUserMobile}
              maxLength={10}
            />
          </View>

          <TouchableOpacity style={styles.buttonMain} onPress={handleLogin}>
            <Text style={styles.buttonText}>Secure Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Dashboard Screen
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <ShieldCheck size={28} color="#1DD3B0" style={{ marginRight: 8 }} />
          <Text style={styles.headerTitle}>My Policies</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <LogOut size={24} color="#a0aab2" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#1DD3B0" style={{ marginTop: 50 }} />
        ) : errorMsg ? (
          <Text style={styles.errorText}>{errorMsg}</Text>
        ) : policies.length === 0 ? (
          <View style={styles.emptyState}>
            <ShieldAlert size={48} color="#a0aab2" />
            <Text style={styles.emptyText}>No policies found for this number.</Text>
          </View>
        ) : (
          policies.map((policy) => {
            const due = new Date(policy.expiryDate);
            const today = new Date();
            const diffTime = due.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let status = 'Active';
            let statusStyle = styles.statusActive;
            
            if (diffDays < 0) {
              status = 'Expired';
              statusStyle = styles.statusExpired;
            } else if (diffDays <= 15) {
              status = 'Expiring Soon';
              statusStyle = styles.statusExpiring;
            }

            return (
              <View key={policy._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.policyName}>{policy.policyType} ({policy.policyNumber})</Text>
                  <View style={[styles.statusBadge, statusStyle]}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                {(status === 'Expiring Soon' || status === 'Expired') && (
                  <View style={[styles.alertRibbon, status === 'Expired' && { borderColor: '#ea4335', backgroundColor: 'rgba(234, 67, 53, 0.1)' }]}>
                    <ShieldAlert size={20} color={status === 'Expired' ? '#ea4335' : '#1DD3B0'} />
                    <Text style={[styles.alertText, status === 'Expired' && { color: '#ea4335' }]}>
                      {status === 'Expired' ? 'Your policy has expired.' : `Renews in ${diffDays} days.`}
                    </Text>
                  </View>
                )}

                <View style={styles.detailsGrid}>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Issue Date</Text>
                    <Text style={styles.detailValue}>{new Date(policy.issueDate).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.detailBox}>
                    <Text style={styles.detailLabel}>Expiry Date</Text>
                    <Text style={styles.detailValue}>{new Date(policy.expiryDate).toLocaleDateString()}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1115',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconWrapper: {
    backgroundColor: '#1a1d24',
    padding: 20,
    borderRadius: 50,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.2)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a0aab2',
    marginBottom: 40,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  label: {
    color: '#a0aab2',
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    width: '100%',
    backgroundColor: '#1a1d24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },
  buttonMain: {
    width: '100%',
    backgroundColor: '#1DD3B0',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1DD3B0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1d24',
    backgroundColor: '#0f1115',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    backgroundColor: '#1a1d24',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  policyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusActive: {
    backgroundColor: 'rgba(52, 168, 83, 0.1)',
    borderColor: '#34a853',
  },
  statusExpiring: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: '#1DD3B0',
  },
  statusExpired: {
    backgroundColor: 'rgba(234, 67, 53, 0.1)',
    borderColor: '#ea4335',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  alertRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderWidth: 1,
    borderColor: '#1DD3B0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    color: '#1DD3B0',
    marginLeft: 8,
    fontWeight: '600',
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  detailBox: {
    flex: 1,
    backgroundColor: '#0f1115',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    color: '#a0aab2',
    fontSize: 12,
    marginBottom: 4,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: '#ea4335',
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: '#a0aab2',
    marginTop: 16,
    fontSize: 16,
  }
});
