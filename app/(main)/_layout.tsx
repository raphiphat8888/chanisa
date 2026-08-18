import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { LoadingScreen } from '@/components/LoadingScreen';
import { appColors } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';

export default function MainLayout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: appColors.primary,
        tabBarInactiveTintColor: appColors.darkMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '800' },
        tabBarStyle: { backgroundColor: appColors.dark, borderTopWidth: 0, height: 72, paddingBottom: 9, paddingTop: 8 },
      }}>
      <Tabs.Screen name="dashboard" options={{ title: 'ภาพรวม', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="grid-outline" size={size} /> }} />
      <Tabs.Screen name="products" options={{ title: 'สินค้า', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="restaurant-outline" size={size} /> }} />
      <Tabs.Screen
        name="orders"
        options={{ title: 'ออเดอร์', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="receipt-outline" size={size} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'ตั้งค่า', tabBarIcon: ({ color, size }) => <Ionicons color={color} name="settings-outline" size={size} /> }}
      />
    </Tabs>
  );
}
