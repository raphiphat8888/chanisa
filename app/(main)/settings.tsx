import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { appColors, appRadius, appSpacing } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, configured, signOut } = useAuth();
  const logout = async () => { await signOut(); router.replace('/login'); };

  return <View style={styles.screen}><View style={styles.content}><Text style={styles.eyebrow}>WORKSPACE SETTINGS</Text><Text style={styles.title}>ตั้งค่าระบบ</Text><Text style={styles.subtitle}>จัดการบัญชีและสถานะการเชื่อมต่อของร้าน</Text>
    <View style={styles.accountCard}><View style={styles.accountAvatar}><Text style={styles.accountAvatarText}>{user?.email.slice(0, 1).toUpperCase() ?? 'M'}</Text></View><View style={styles.accountCopy}><Text style={styles.accountLabel}>{user?.role === 'admin' ? 'บัญชีผู้ดูแล' : 'บัญชีผู้ใช้งาน'}</Text><Text style={styles.accountEmail}>{user?.email}</Text></View><Ionicons color={appColors.mint} name="checkmark-circle" size={21} /></View>
    <View style={styles.infoCard}><InfoRow icon="cloud-done-outline" label="Cloud data" value={configured && !user?.isDemo ? 'MySQL connected' : 'Demo data mode'} tone={configured && !user?.isDemo ? appColors.mint : '#B9821D'} /><InfoRow icon="shield-checkmark-outline" label="Authentication" value={configured && !user?.isDemo ? 'Username + password' : 'Preview only'} tone={configured && !user?.isDemo ? appColors.mint : '#B9821D'} /><InfoRow icon="logo-github" label="Repository" value="chanisa-a/chanisa" tone={appColors.primary} /></View>
    <Pressable onPress={logout} style={({ pressed }) => [styles.logout, pressed && styles.pressed]}><Ionicons color={appColors.danger} name="log-out-outline" size={18} /><Text style={styles.logoutText}>ออกจากระบบ</Text></Pressable>
  </View></View>;
}

function InfoRow({ icon, label, value, tone }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string; tone: string }) {
  return <View style={styles.infoRow}><View style={[styles.infoIcon, { backgroundColor: `${tone}18` }]}><Ionicons color={tone} name={icon} size={18} /></View><View style={styles.infoCopy}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View><View style={[styles.dot, { backgroundColor: tone }]} /> </View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: appColors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 760, padding: appSpacing.page, width: '100%' },
  eyebrow: { color: appColors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 8, marginTop: 8 },
  title: { color: appColors.ink, fontSize: 28, fontWeight: '900' },
  subtitle: { color: appColors.muted, fontSize: 12, marginTop: 6 },
  accountCard: { alignItems: 'center', backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, flexDirection: 'row', marginTop: 28, padding: 16 },
  accountAvatar: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: 21, height: 42, justifyContent: 'center', width: 42 },
  accountAvatarText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  accountCopy: { flex: 1, marginLeft: 12 },
  accountLabel: { color: appColors.muted, fontSize: 10, fontWeight: '800' },
  accountEmail: { color: appColors.ink, fontSize: 14, fontWeight: '900', marginTop: 4 },
  infoCard: { backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, marginTop: 12, paddingHorizontal: 16 },
  infoRow: { alignItems: 'center', borderBottomColor: appColors.border, borderBottomWidth: 1, flexDirection: 'row', minHeight: 67 },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { alignItems: 'center', borderRadius: 10, height: 37, justifyContent: 'center', width: 37 },
  infoCopy: { flex: 1, marginLeft: 12 },
  infoLabel: { color: appColors.muted, fontSize: 10, fontWeight: '700' },
  infoValue: { color: appColors.ink, fontSize: 12, fontWeight: '900', marginTop: 3 },
  dot: { borderRadius: 5, height: 9, width: 9 },
  logout: { alignItems: 'center', borderColor: '#F4CDD1', borderRadius: appRadius.control, borderWidth: 1, flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 24, minHeight: 48 },
  logoutText: { color: appColors.danger, fontSize: 12, fontWeight: '900' },
  pressed: { opacity: 0.75 },
});
