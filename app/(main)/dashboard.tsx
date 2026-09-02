import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { appColors, appRadius, appSpacing } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { products, loading } = useProducts();

  if (loading) return <LoadingScreen label="กำลังโหลดข้อมูลร้าน..." />;

  const available = products.filter((product) => product.available).length;
  const unavailable = products.length - available;
  const categoryCount = new Set(products.map((product) => product.category)).size;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View><Text style={styles.eyebrow}>MONDAY • 16 AUG 2026</Text><Text style={styles.title}>สวัสดี, ผู้ดูแลร้าน ☕</Text></View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{user?.email.slice(0, 1).toUpperCase() ?? 'M'}</Text></View>
      </View>

      <View style={styles.hero}>
        <View style={styles.heroCopy}><Text style={styles.heroEyebrow}>TODAY’S CONTROL ROOM ✨</Text><Text style={styles.heroTitle}>ร้านพร้อมขาย{ '\n' }แค่ไหนแล้ว?</Text><Text style={styles.heroBody}>จัดการเมนูให้สดใหม่ ตรวจสถานะ และดูภาพรวมได้ในไม่กี่วินาที</Text></View>
        <View style={styles.heroOrb}><Ionicons color="#FFF" name="sparkles-outline" size={30} /></View>
      </View>

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>ภาพรวมเมนู</Text><Text style={styles.sectionSub}>ข้อมูลล่าสุดจากระบบร้าน</Text></View><View style={styles.live}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View></View>
      <View style={styles.statsGrid}>
        <StatCard icon="restaurant-outline" label="เมนูทั้งหมด" value={products.length} tint={appColors.primary} />
        <StatCard icon="checkmark-circle-outline" label="พร้อมขาย" value={available} tint={appColors.mint} />
        <StatCard icon="pause-circle-outline" label="ปิดขาย" value={unavailable} tint={appColors.danger} />
        <StatCard icon="pricetags-outline" label="หมวดหมู่" value={categoryCount} tint="#B9825B" />
      </View>

      <View style={styles.sectionHeading}><View><Text style={styles.sectionTitle}>เมนูที่อัปเดตล่าสุด</Text><Text style={styles.sectionSub}>ตรวจสอบรายการที่ลูกค้าเห็น</Text></View><Pressable onPress={() => router.push('/products')}><Text style={styles.link}>ดูทั้งหมด  →</Text></Pressable></View>
      <View style={styles.recentCard}>
        {products.slice(0, 4).map((product, index) => (
          <View key={product.id} style={[styles.recentRow, index < Math.min(products.length, 4) - 1 && styles.rowBorder]}>
            <View style={styles.recentNumber}><Text style={styles.recentNumberText}>{String(index + 1).padStart(2, '0')}</Text></View>
            <View style={styles.recentCopy}><Text style={styles.recentName} numberOfLines={1}>{product.name}</Text><Text style={styles.recentCategory}>{product.category}</Text></View>
            <View style={[styles.miniStatus, product.available ? styles.miniStatusOn : styles.miniStatusOff]}><Text style={[styles.miniStatusText, product.available ? styles.miniStatusTextOn : styles.miniStatusTextOff]}>{product.available ? 'พร้อมขาย' : 'ปิดขาย'}</Text></View>
          </View>
        ))}
        {products.length === 0 && <Text style={styles.emptyText}>ยังไม่มีเมนูในระบบ</Text>}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, tint }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: number; tint: string }) {
  return <View style={styles.statCard}><View style={[styles.statIcon, { backgroundColor: `${tint}18` }]}><Ionicons color={tint} name={icon} size={20} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: appColors.background, flex: 1 },
  content: { alignSelf: 'center', maxWidth: 980, padding: appSpacing.page, paddingBottom: 36, width: '100%' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 22 },
  eyebrow: { color: appColors.subtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 7 },
  title: { color: appColors.ink, fontSize: 25, fontWeight: '900', letterSpacing: -0.5 },
  avatar: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: 18, height: 42, justifyContent: 'center', width: 42 },
  avatarText: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  hero: { backgroundColor: appColors.dark, borderRadius: appRadius.card, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 28, minHeight: 190, overflow: 'hidden', padding: 23 },
  heroCopy: { maxWidth: 470 },
  heroEyebrow: { color: '#F2B79C', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 12 },
  heroTitle: { color: '#FFF', fontSize: 28, fontWeight: '900', letterSpacing: -0.6, lineHeight: 32 },
  heroBody: { color: '#A4A6B2', fontSize: 12, lineHeight: 19, marginTop: 12, maxWidth: 350 },
  heroOrb: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: 40, height: 72, justifyContent: 'center', marginRight: 3, marginTop: 4, width: 72 },
  sectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, marginTop: 2 },
  sectionTitle: { color: appColors.ink, fontSize: 17, fontWeight: '900' },
  sectionSub: { color: appColors.muted, fontSize: 10, marginTop: 4 },
  live: { alignItems: 'center', flexDirection: 'row' },
  liveDot: { backgroundColor: appColors.mint, borderRadius: 4, height: 7, marginRight: 5, width: 7 },
  liveText: { color: appColors.mint, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 27 },
  statCard: { backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, flexBasis: '23%', flexGrow: 1, minWidth: 130, padding: 15 },
  statIcon: { alignItems: 'center', borderRadius: 10, height: 37, justifyContent: 'center', marginBottom: 14, width: 37 },
  statValue: { color: appColors.ink, fontSize: 25, fontWeight: '900', fontVariant: ['tabular-nums'] },
  statLabel: { color: appColors.muted, fontSize: 10, fontWeight: '700', marginTop: 3 },
  link: { color: appColors.primary, fontSize: 11, fontWeight: '900' },
  recentCard: { backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, paddingHorizontal: 16 },
  recentRow: { alignItems: 'center', flexDirection: 'row', minHeight: 68, paddingVertical: 10 },
  rowBorder: { borderBottomColor: appColors.border, borderBottomWidth: 1 },
  recentNumber: { alignItems: 'center', backgroundColor: '#FBE5D8', borderRadius: 9, height: 35, justifyContent: 'center', marginRight: 12, width: 35 },
  recentNumberText: { color: appColors.primary, fontSize: 10, fontWeight: '900' },
  recentCopy: { flex: 1, minWidth: 0 },
  recentName: { color: appColors.ink, fontSize: 13, fontWeight: '900' },
  recentCategory: { color: appColors.muted, fontSize: 10, marginTop: 4 },
  miniStatus: { borderRadius: appRadius.pill, marginLeft: 8, paddingHorizontal: 8, paddingVertical: 5 },
  miniStatusOn: { backgroundColor: appColors.mintSoft },
  miniStatusOff: { backgroundColor: '#F1F2F5' },
  miniStatusText: { fontSize: 9, fontWeight: '900' },
  miniStatusTextOn: { color: appColors.mint },
  miniStatusTextOff: { color: appColors.muted },
  emptyText: { color: appColors.muted, fontSize: 12, padding: 22, textAlign: 'center' },
});
