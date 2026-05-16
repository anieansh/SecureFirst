import React, { useEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../_layout';
import { ArrowLeft, Download, RefreshCcw, Shield, Calendar, CreditCard, User, Hash, FileUp, FileCheck } from 'lucide-react-native';
import { useTheme } from '../theme';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../../utils/apiClient';
import { API_ENDPOINTS } from '../../constants/api';

const API_URL = API_ENDPOINTS.POLICIES;

export default function PolicyDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { userMobile } = useAuth();
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rcImage, setRcImage] = useState<any>(null);
  const [previousPolicyImage, setPreviousPolicyImage] = useState<any>(null);
  const [isRenewalModalOpen, setIsRenewalModalOpen] = useState(false);
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res = await apiClient.get(`${API_URL}/${userMobile}`);
        const data = res.data.data || res.data;
        const policies = data || [];
        
        const found = policies.find((p: any) => p._id === id);
        if (found) setPolicy(found);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (userMobile && id) fetchPolicy();
  }, [userMobile, id]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.accentGold} style={{ marginTop: 50 }} />
      </SafeAreaView>
    );
  }

  if (!policy) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
        </View>
        <Text style={styles.errorText}>Policy details could not be loaded.</Text>
      </SafeAreaView>
    );
  }

  const due = new Date(policy.expiryDate);
  const today = new Date();
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / 86400000);

  let status = 'Active';
  let statusColor = colors.accentSuccess;
  
  if (diffDays < 0) {
    status = 'Expired';
    statusColor = colors.accentDanger;
  } else if (diffDays <= 15) {
    status = 'Expiring Soon';
    statusColor = colors.accentWarning;
  }

  const handleDownload = async () => {
    if (!policy.attachedDocument) return;
    
    try {
      setLoading(true);
      const fileUrl = `https://api.securefirst.co/uploads/${policy.attachedDocument}`;
      const fileUri = `${FileSystem.documentDirectory}${policy.attachedDocument}`;
      
      const downloadRes = await FileSystem.downloadAsync(fileUrl, fileUri);
      
      if (downloadRes.status === 200) {
        await Sharing.shareAsync(downloadRes.uri);
      } else {
        Alert.alert('Download Failed', 'Could not download the document from the server.');
      }
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'An error occurred while downloading the policy document.');
    } finally {
      setLoading(false);
    }
  };

  const handlePickDocument = async (setDoc: (doc: any) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDoc(result.assets[0]);
      }
    } catch (err) {
      console.error('Error picking document', err);
    }
  };

  const handlePickImage = async (setDoc: (doc: any) => void, useCamera: boolean) => {
    try {
      const permissionResult = useCamera 
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        alert(`Permission to access ${useCamera ? 'camera' : 'gallery'} is required!`);
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.7 })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.7,
          });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setDoc({
          uri: asset.uri,
          name: asset.fileName || (useCamera ? 'camera_image.jpg' : 'gallery_image.jpg'),
          mimeType: 'image/jpeg',
          size: asset.fileSize
        });
      }
    } catch (err) {
      console.error('Error picking image', err);
    }
  };

  const handleUploadSource = (setDoc: (doc: any) => void) => {
    const options = [
      { text: 'Take Photo', onPress: () => handlePickImage(setDoc, true) },
      { text: 'Choose from Gallery', onPress: () => handlePickImage(setDoc, false) },
      { text: 'Select Document (PDF/Files)', onPress: () => handlePickDocument(setDoc) },
      { text: 'Cancel', style: 'cancel' }
    ];
    Alert.alert('Select Upload Source', 'Choose how you want to upload the document', options as any);
  };

  const handleRenewal = async (withDocs: boolean) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('name', policy.clientName);
      formData.append('mobileNumber', userMobile || '');
      formData.append('policyType', policy.policyType);
      formData.append('carCondition', policy.policyType === 'Motor' ? 'Old' : undefined);
      formData.append('vehicleNumber', policy.vehicleNumber || '');
      formData.append('notes', `Renewal request for Policy #${policy.policyNumber}`);

      if (withDocs) {
        if (rcImage) {
          formData.append('rcImage', {
            uri: rcImage.uri,
            name: rcImage.name || 'rcImage.jpg',
            type: rcImage.mimeType || 'image/jpeg'
          } as any);
        }
        if (previousPolicyImage) {
          formData.append('previousPolicyImage', {
            uri: previousPolicyImage.uri,
            name: previousPolicyImage.name || 'prevPolicy.jpg',
            type: previousPolicyImage.mimeType || 'image/jpeg'
          } as any);
        }
      }

      await apiClient.post(API_ENDPOINTS.LEADS, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setIsRenewalModalOpen(false);
      setRcImage(null);
      setPreviousPolicyImage(null);
      Alert.alert('Success', 'Your renewal request has been submitted. Our agent will contact you soon.');
    } catch (err) {
      console.error('Renewal error:', err);
      Alert.alert('Error', 'Could not submit renewal request. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Policy Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 20 }}>
        
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            <Text style={styles.policyName}>{policy.policyType}</Text>
            <View style={[styles.statusBadge, { borderColor: statusColor }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{status}</Text>
            </View>
          </View>
          <Text style={styles.policyNumber}>
            {policy.policyType === 'Motor' ? `Vehicle No: ${policy.vehicleNumber || '-'}` : ''}
          </Text>
          <Text style={styles.insurerName}>Insured by {policy.insurer}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coverage Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>
                {policy.policyType === 'Motor' ? 'Vehicle Number' : 'Sum Insured'}
              </Text>
              <Text style={styles.detailValue}>
                {policy.policyType === 'Motor' ? (policy.vehicleNumber || 'N/A') : `₹${policy.sumInsured?.toLocaleString() || 'N/A'}`}
              </Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>Annual Premium</Text>
              <Text style={styles.detailValue}>₹{policy.annualPremium?.toLocaleString() || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Validity</Text>
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

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.bgSecondary }]} 
            onPress={() => setIsRenewalModalOpen(true)}
          >
            <RefreshCcw size={22} color={colors.accentGold} />
            <Text style={[styles.actionBtnText, { color: colors.accentGold }]}>Request Renewal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownload}>
            <Download size={20} color={colors.accentGold} />
            <Text style={styles.secondaryBtnText}>Download Policy PDF</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Renewal Modal */}
      {isRenewalModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Renewal Request</Text>
            <Text style={styles.modalDesc}>Do you have the RC or previous policy document? Uploading them helps us process your renewal faster.</Text>
            
            <View style={styles.uploadSection}>
              <TouchableOpacity style={styles.uploadRow} onPress={() => handleUploadSource(setRcImage)}>
                <View style={styles.uploadIconBox}>
                  {rcImage ? <FileCheck size={20} color={colors.accentSuccess} /> : <FileUp size={20} color={colors.textSecondary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadLabel}>RC Document</Text>
                  <Text style={[styles.uploadStatus, rcImage && { color: colors.accentSuccess }]}>
                    {rcImage ? rcImage.name : 'Not selected'}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.uploadRow} onPress={() => handleUploadSource(setPreviousPolicyImage)}>
                <View style={styles.uploadIconBox}>
                  {previousPolicyImage ? <FileCheck size={20} color={colors.accentSuccess} /> : <FileUp size={20} color={colors.textSecondary} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.uploadLabel}>Previous Policy</Text>
                  <Text style={[styles.uploadStatus, previousPolicyImage && { color: colors.accentSuccess }]}>
                    {previousPolicyImage ? previousPolicyImage.name : 'Not selected'}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelBtn} 
                onPress={() => {
                  setIsRenewalModalOpen(false);
                  setRcImage(null);
                  setPreviousPolicyImage(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.confirmBtn} 
                onPress={() => handleRenewal(!!(rcImage || previousPolicyImage))}
              >
                <Text style={styles.confirmBtnText}>
                  {(rcImage || previousPolicyImage) ? 'Upload & Send' : 'Send Without Docs'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { padding: 10, backgroundColor: colors.bgPrimary, borderRadius: 16 },
  headerTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary },
  errorText: { color: colors.accentDanger, textAlign: 'center', marginTop: 40, fontSize: 16, fontWeight: '600' },
  topCard: { backgroundColor: colors.bgSecondary, borderRadius: 28, padding: 26, marginBottom: 28, borderWidth: 1, borderColor: colors.borderLight, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 6 },
  topCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  policyName: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, flex: 1, letterSpacing: -1 },
  policyNumber: { fontSize: 16, color: colors.textSecondary, marginBottom: 10, fontWeight: '700' },
  insurerName: { fontSize: 16, color: colors.accentGold, fontWeight: '800' },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, backgroundColor: 'transparent' },
  statusText: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 28 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: colors.textPrimary, marginBottom: 16, letterSpacing: -0.5 },
  detailsGrid: { flexDirection: 'row', gap: 14 },
  detailBox: { flex: 1, backgroundColor: colors.bgPrimary, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.borderLight },
  detailLabel: { color: colors.textSecondary, fontSize: 13, marginBottom: 8, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '900' },
  actionSection: { marginTop: 14, gap: 16, paddingBottom: 40 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, borderRadius: 20, borderWidth: 2, borderColor: colors.accentGold, gap: 10 },
  actionBtnText: { fontSize: 15, fontWeight: '800' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary, paddingVertical: 20, borderRadius: 20, borderWidth: 2, borderColor: colors.borderLight, gap: 10 },
  secondaryBtnText: { color: colors.accentGold, fontSize: 18, fontWeight: '800' },

  // Modal Styles
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 1000 },
  modalContent: { width: '100%', backgroundColor: '#1A1A1A', borderRadius: 32, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#FFF', marginBottom: 12 },
  modalDesc: { fontSize: 15, color: '#AAA', lineHeight: 22, marginBottom: 24 },
  uploadSection: { gap: 16, marginBottom: 32 },
  uploadRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#333', gap: 16 },
  uploadIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' },
  uploadLabel: { fontSize: 14, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 1 },
  uploadStatus: { fontSize: 13, color: '#666', marginTop: 2 },
  modalActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 18, borderRadius: 20, backgroundColor: '#222', alignItems: 'center' },
  cancelBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  confirmBtn: { flex: 2, paddingVertical: 18, borderRadius: 20, backgroundColor: colors.accentGold, alignItems: 'center' },
  confirmBtnText: { color: '#000', fontWeight: '900', fontSize: 16 },
});
