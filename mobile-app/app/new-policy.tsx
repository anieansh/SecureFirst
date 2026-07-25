import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Platform, Alert, SafeAreaView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, CheckCircle, FileUp, FileCheck } from 'lucide-react-native';
import axios from 'axios';
import { useAuth } from './_layout';
import { useTheme } from './theme';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import apiClient from '../utils/apiClient';

import { API_ENDPOINTS } from '../constants/api';

const API_URL = API_ENDPOINTS.LEADS;


export default function NewPolicyScreen() {
  const { userMobile } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState('');
  const [policyType, setPolicyType] = useState('Motor'); // Motor, Non Motor, Travel
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Motor specific fields
  const [carCondition, setCarCondition] = useState('New'); // New, Old
  const [carName, setCarName] = useState('');
  const [exShowroomPrice, setExShowroomPrice] = useState('');
  
  const [vehicleNo, setVehicleNo] = useState('');
  const [rcImage, setRcImage] = useState<any>(null);
  const [previousPolicyImage, setPreviousPolicyImage] = useState<any>(null);

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
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.7,
          })
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

  const handleSubmit = async () => {
    if (!name || !policyType) {
      alert('Please fill in your name and select a policy type.');
      return;
    }
    if (policyType === 'Motor') {
      if (carCondition === 'New' && (!carName || !exShowroomPrice)) {
        alert('Please provide car name and ex-showroom price for a new car.');
        return;
      }
      if (carCondition === 'Old' && !vehicleNo) {
        alert('Please enter the vehicle registration number.');
        return;
      }
      if (carCondition === 'Old' && !rcImage) {
        alert('Please upload RC document for an old car.');
        return;
      }
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('policyType', policyType);
      formData.append('mobileNumber', userMobile || '');

      if (policyType === 'Motor') {
        formData.append('carCondition', carCondition);
        if (carCondition === 'New') {
          formData.append('carName', carName);
          formData.append('exShowroomPrice', exShowroomPrice);
        } else if (carCondition === 'Old') {
          formData.append('vehicleNumber', vehicleNo);
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
      }

      await apiClient.post(API_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const types = ['Motor', 'Non Motor', 'Travel'];
  const conditions = ['New', 'Old'];

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Policy Request</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.formContainer}>
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
            <Text style={styles.label}>Car Condition</Text>
            <View style={[styles.pillContainer, { marginBottom: 24 }]}>
              {conditions.map(c => (
                <TouchableOpacity 
                  key={c} 
                  style={[styles.pill, carCondition === c && styles.pillActive]} 
                  onPress={() => setCarCondition(c)}
                >
                  <Text style={[styles.pillText, carCondition === c && styles.pillTextActive]}>{c} Car</Text>
                </TouchableOpacity>
              ))}
            </View>

            {carCondition === 'New' ? (
              <>
                <Text style={styles.label}>Car Name</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. Hyundai Creta" 
                  placeholderTextColor={colors.textSecondary}
                  value={carName} 
                  onChangeText={setCarName} 
                />

                <Text style={styles.label}>Ex-Showroom Price</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="e.g. 1500000" 
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={exShowroomPrice} 
                  onChangeText={setExShowroomPrice} 
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Vehicle Registration Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. MH02AB1234"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="characters"
                  value={vehicleNo}
                  onChangeText={setVehicleNo}
                />

                <Text style={styles.label}>Upload RC (PNG, JPG, PDF)</Text>
                <TouchableOpacity style={styles.uploadWidget} onPress={() => handleUploadSource(setRcImage)}>
                  {rcImage ? (
                    <View style={styles.uploadContent}>
                      <FileCheck size={28} color={colors.accentSuccess} />
                      <Text style={styles.uploadTextSuccess}>{rcImage.name}</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <FileUp size={28} color={colors.textSecondary} />
                      <Text style={styles.uploadText}>+ Upload RC Image</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <Text style={styles.label}>Previous Policy (If Any)</Text>
                <TouchableOpacity style={styles.uploadWidget} onPress={() => handleUploadSource(setPreviousPolicyImage)}>
                  {previousPolicyImage ? (
                    <View style={styles.uploadContent}>
                      <FileCheck size={28} color={colors.accentSuccess} />
                      <Text style={styles.uploadTextSuccess}>{previousPolicyImage.name}</Text>
                    </View>
                  ) : (
                    <View style={styles.uploadContent}>
                      <FileUp size={28} color={colors.textSecondary} />
                      <Text style={styles.uploadText}>+ Upload Policy Image</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
        
        <View style={{ height: 40 }} />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.bgPrimary} /> : <Text style={styles.primaryBtnText}>Submit Lead</Text>}
        </TouchableOpacity>
        <View style={{ height: insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 20, backgroundColor: colors.bgSecondary, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  backBtn: { padding: 10, backgroundColor: colors.bgPrimary, borderRadius: 16 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: colors.textPrimary },
  formContainer: { paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 },
  label: { color: colors.textSecondary, marginBottom: 12, fontSize: 14, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 },
  input: { width: '100%', backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight, borderRadius: 20, padding: 20, color: colors.textPrimary, fontSize: 18, fontWeight: '700', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2, marginBottom: 32 },
  pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  pill: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: 24, backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight },
  pillActive: { backgroundColor: colors.accentGold, borderColor: colors.accentGold },
  pillText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  pillTextActive: { color: colors.bgPrimary },
  uploadWidget: { backgroundColor: colors.bgSecondary, borderWidth: 2, borderColor: colors.borderLight, borderStyle: 'dashed', borderRadius: 20, padding: 20, marginBottom: 32, alignItems: 'center', justifyContent: 'center' },
  uploadContent: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  uploadText: { color: colors.textSecondary, fontSize: 16, fontWeight: '700' },
  uploadTextSuccess: { color: colors.accentSuccess, fontSize: 16, fontWeight: '700' },
  primaryBtn: { width: '100%', backgroundColor: colors.textPrimary, padding: 22, borderRadius: 20, alignItems: 'center', shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  primaryBtnText: { color: colors.bgPrimary, fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  successWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 30 },
  successTitle: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginBottom: 16, textAlign: 'center' },
  successDesc: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: 40, fontWeight: '500' }
});
