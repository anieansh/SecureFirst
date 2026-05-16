import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, SafeAreaView, TouchableOpacity, Switch } from 'react-native';
import { useAuth } from '../_layout';
import axios from 'axios';
import { User, LogOut, ChevronRight, Settings, Bell, Phone, Moon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme, useThemeMode } from '../theme';

import { Platform } from 'react-native';
import { API_ENDPOINTS } from '../../constants/api';

const API_URL = API_ENDPOINTS.POLICIES;



export default function ProfileScreen() {
  const { userMobile, userEmail, userName: contextName, logout } = useAuth();
  const userName = contextName || 'Client';
  const colors = useTheme();
  const { isDark, toggleTheme } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleSignOut = () => {
    logout();
  };

  const menuItems = [
    { title: 'Personal Details', icon: <User size={20} color={colors.textSecondary} />, route: '/profile/personal-details' },
    { title: 'Notification Preferences', icon: <Bell size={20} color={colors.textSecondary} />, route: '/profile/notifications' },
    { title: 'Security', icon: <Settings size={20} color={colors.textSecondary} />, route: '/profile/security' },
    { title: 'Contact Agent', icon: <Phone size={20} color={colors.accentGold} />, route: '/profile/contact-agent' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 20 }}>
        
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{userName}</Text>
          <Text style={styles.phone}>+91 {userMobile}</Text>
          {userEmail ? <Text style={styles.email}>{userEmail}</Text> : null}
        </View>

        <View style={styles.menuGroup}>
          <View style={styles.menuItemDark}>
            <View style={styles.menuItemLeft}>
              <Moon size={20} color={colors.textSecondary} />
              <Text style={styles.menuItemText}>Dark Mode</Text>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              trackColor={{ false: colors.borderLight, true: colors.accentGold }}
              thumbColor="#FFFFFF"
            />
          </View>

          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={[styles.menuItem, index === menuItems.length - 1 && { borderBottomWidth: 0 }]} onPress={() => router.push(item.route as any)}>
              <View style={styles.menuItemLeft}>
                {item.icon}
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut}>
          <LogOut size={20} color={colors.accentDanger} />
          <Text style={styles.logoutText}>Sign Out Securely</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  profileHeader: { alignItems: 'center', marginVertical: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: colors.bgSecondary, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 2, borderColor: colors.borderLight },
  avatarText: { fontSize: 40, fontWeight: '900', color: colors.accentGold },
  name: { fontSize: 32, fontWeight: '900', color: colors.textPrimary, marginBottom: 6, letterSpacing: -1 },
  phone: { fontSize: 18, color: colors.textSecondary, fontWeight: '600' },
  email: { fontSize: 14, color: colors.textSecondary, fontWeight: '500', marginTop: 4 },
  menuGroup: { backgroundColor: colors.bgSecondary, borderRadius: 28, paddingVertical: 10, marginBottom: 32, borderWidth: 1, borderColor: colors.borderLight, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  menuItemDark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 24, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { color: colors.textPrimary, fontSize: 17, marginLeft: 18, fontWeight: '700' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgSecondary, paddingVertical: 20, borderRadius: 20, borderWidth: 1, borderColor: colors.accentDanger, shadowColor: colors.shadowColor, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  logoutText: { color: colors.accentDanger, fontSize: 17, fontWeight: '900', marginLeft: 12 }
});
