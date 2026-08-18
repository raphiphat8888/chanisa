import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { appColors, appRadius, appSpacing } from '@/constants/appTheme';

export default function OrdersScreen() {
  return <View style={styles.screen}><View style={styles.content}><View style={styles.icon}><Ionicons color={appColors.primary} name="receipt-outline" size={30} /></View><Text style={styles.eyebrow}>ORDER CENTER</Text><Text style={styles.title}>ออเดอร์กำลังจะมา</Text><Text style={styles.body}>โครงสร้าง navigation พร้อมแล้ว หน้านี้รอเชื่อมตาราง orders เพื่อแสดงรายการออเดอร์แบบ real-time</Text><View style={styles.note}><Ionicons color={appColors.mint} name="sparkles-outline" size={17} /><Text style={styles.noteText}>เมนูและระบบ Login พร้อมต่อยอดเข้ากับออเดอร์ในขั้นถัดไป</Text></View></View></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: appColors.background, flex: 1 },
  content: { alignItems: 'center', alignSelf: 'center', justifyContent: 'center', maxWidth: 500, padding: appSpacing.page, flex: 1 },
  icon: { alignItems: 'center', backgroundColor: appColors.primarySoft, borderRadius: 20, height: 70, justifyContent: 'center', marginBottom: 20, width: 70 },
  eyebrow: { color: appColors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 10 },
  title: { color: appColors.ink, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  body: { color: appColors.muted, fontSize: 13, lineHeight: 21, marginTop: 12, textAlign: 'center' },
  note: { alignItems: 'center', backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.control, borderWidth: 1, flexDirection: 'row', gap: 8, marginTop: 22, padding: 14 },
  noteText: { color: appColors.muted, flex: 1, fontSize: 11, lineHeight: 17 },
});
