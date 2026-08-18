import { Redirect, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { appColors, appRadius, appSpacing } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { user, configured, signIn, signUp, enterDemoMode } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  if (user) return <Redirect href="/dashboard" />;

  const submit = async () => {
    setMessage('');
    if (!username.trim() || password.length < 6) {
      setMessage('กรุณากรอกชื่อผู้ใช้ และรหัสผ่านอย่างน้อย 6 ตัวอักษร');
      return;
    }
    setBusy(true);
    const error = mode === 'signin' ? await signIn(username, password) : await signUp(username, password);
    setBusy(false);
    if (error) {
      setMessage(error);
      return;
    }
    if (mode === 'signup') {
      setMode('signin');
      setMessage('สร้างบัญชีแล้ว กรุณาเข้าสู่ระบบด้วยชื่อผู้ใช้และรหัสผ่าน');
    } else {
      router.replace('/dashboard');
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>M</Text></View>
          <View><Text style={styles.brandName}>MENUPILOT</Text><Text style={styles.brandCaption}>RESTAURANT CONTROL ROOM</Text></View>
        </View>

        <View style={styles.heroBlock}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>จัดการร้านให้{ '\n' }เป็นเรื่องง่าย</Text>
          <Text style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการเมนู ราคา และสถานะการขายจากที่เดียว</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.modeRow}>
            <Pressable onPress={() => { setMode('signin'); setMessage(''); }} style={[styles.modeButton, mode === 'signin' && styles.modeButtonActive]}><Text style={[styles.modeText, mode === 'signin' && styles.modeTextActive]}>เข้าสู่ระบบ</Text></Pressable>
            <Pressable onPress={() => { setMode('signup'); setMessage(''); }} style={[styles.modeButton, mode === 'signup' && styles.modeButtonActive]}><Text style={[styles.modeText, mode === 'signup' && styles.modeTextActive]}>สร้างบัญชี</Text></Pressable>
          </View>

          <Text style={styles.label}>ชื่อผู้ดูแล</Text>
          <TextInput autoCapitalize="none" autoComplete="username" value={username} onChangeText={setUsername} placeholder="เช่น admin" placeholderTextColor={appColors.subtle} style={styles.input} />
          <Text style={styles.label}>รหัสผ่าน</Text>
          <TextInput autoCapitalize="none" autoComplete="password" secureTextEntry value={password} onChangeText={setPassword} placeholder="อย่างน้อย 6 ตัวอักษร" placeholderTextColor={appColors.subtle} style={styles.input} />

          {!!message && <Text style={styles.message}>{message}</Text>}

          <Pressable disabled={busy} onPress={submit} style={({ pressed }) => [styles.submit, pressed && styles.pressed, busy && styles.disabled]}>
            <Text style={styles.submitText}>{busy ? 'กำลังตรวจสอบ...' : mode === 'signin' ? 'เข้าสู่ระบบ  →' : 'สร้างบัญชี  →'}</Text>
          </Pressable>

          {!configured && (
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>โหมดตัวอย่างสำหรับดูหน้าจอ</Text>
              <Text style={styles.demoText}>ยังไม่มีค่า Supabase ในเครื่องนี้ จึงเปิดโหมดตัวอย่างให้ทดสอบ UI และ CRUD ได้ก่อน</Text>
              <Pressable onPress={enterDemoMode} style={styles.demoButton}><Text style={styles.demoButtonText}>เข้าโหมดตัวอย่าง</Text></Pressable>
            </View>
          )}
        </View>

        <Text style={styles.footer}>CLOUD AUTH • PRODUCT DATA • ONE WORKSPACE</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: appColors.background, flex: 1 },
  content: { alignSelf: 'center', flexGrow: 1, justifyContent: 'center', maxWidth: 620, padding: appSpacing.page, width: '100%' },
  brandRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginBottom: 52 },
  brandMark: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: 15, height: 46, justifyContent: 'center', width: 46 },
  brandMarkText: { color: '#FFF', fontSize: 23, fontWeight: '900' },
  brandName: { color: appColors.ink, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  brandCaption: { color: appColors.subtle, fontSize: 8, fontWeight: '800', letterSpacing: 1.2, marginTop: 4 },
  heroBlock: { marginBottom: 28 },
  eyebrow: { color: appColors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 2.4, marginBottom: 12 },
  title: { color: appColors.ink, fontSize: 39, fontWeight: '900', letterSpacing: -1.1, lineHeight: 43 },
  subtitle: { color: appColors.muted, fontSize: 14, lineHeight: 22, marginTop: 14, maxWidth: 420 },
  card: { backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, padding: 20 },
  modeRow: { backgroundColor: '#F4F5F9', borderRadius: 11, flexDirection: 'row', marginBottom: 22, padding: 4 },
  modeButton: { alignItems: 'center', borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 40 },
  modeButtonActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#313A55', shadowOpacity: 0.08, shadowRadius: 7 },
  modeText: { color: appColors.muted, fontSize: 12, fontWeight: '800' },
  modeTextActive: { color: appColors.ink },
  label: { color: appColors.ink, fontSize: 11, fontWeight: '900', marginBottom: 8, marginTop: 13 },
  input: { backgroundColor: '#FAFBFD', borderColor: appColors.border, borderRadius: appRadius.control, borderWidth: 1, color: appColors.ink, fontSize: 14, minHeight: 48, paddingHorizontal: 14 },
  message: { color: appColors.danger, fontSize: 12, lineHeight: 18, marginTop: 13 },
  submit: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: appRadius.control, justifyContent: 'center', marginTop: 20, minHeight: 50 },
  submitText: { color: '#FFF', fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  demoBox: { backgroundColor: appColors.primarySoft, borderRadius: appRadius.control, marginTop: 18, padding: 14 },
  demoTitle: { color: appColors.primaryDark, fontSize: 12, fontWeight: '900' },
  demoText: { color: '#655C86', fontSize: 11, lineHeight: 17, marginTop: 5 },
  demoButton: { alignItems: 'center', borderColor: '#CFC5FF', borderRadius: 9, borderWidth: 1, justifyContent: 'center', marginTop: 11, minHeight: 40 },
  demoButtonText: { color: appColors.primaryDark, fontSize: 11, fontWeight: '900' },
  footer: { color: appColors.subtle, fontSize: 8, fontWeight: '900', letterSpacing: 1.8, marginTop: 24, textAlign: 'center' },
});
