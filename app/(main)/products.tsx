import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { LoadingScreen } from '@/components/LoadingScreen';
import { appColors, appRadius, appSpacing } from '@/constants/appTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts } from '@/contexts/ProductsContext';
import { productCategories, type Product, type ProductInput } from '@/types/product';

const filters = ['ทั้งหมด', ...productCategories];
const emptyProduct: ProductInput = { name: '', category: productCategories[0], price: 0, description: '', imageUrl: '', available: true };

export default function ProductsScreen() {
  const { products, loading, saving, error, createProduct, updateProduct, deleteProduct, toggleProduct } = useProducts();
  const { user } = useAuth();
  const canManage = user?.role === 'admin';
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ทั้งหมด');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductInput>(emptyProduct);
  const [formError, setFormError] = useState('');

  const visibleProducts = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesFilter = filter === 'ทั้งหมด' || product.category === filter;
      const matchesQuery = !keyword || [product.name, product.description, product.category].some((value) => value.toLowerCase().includes(keyword));
      return matchesFilter && matchesQuery;
    });
  }, [filter, products, query]);

  if (loading) return <LoadingScreen label="กำลังโหลดเมนู..." />;

  const openCreate = () => { setEditingId(null); setDraft({ ...emptyProduct }); setFormError(''); setModalVisible(true); };
  const openEdit = (product: Product) => { setEditingId(product.id); setDraft({ name: product.name, category: product.category, price: product.price, description: product.description, imageUrl: product.imageUrl, available: product.available }); setFormError(''); setModalVisible(true); };

  const save = async () => {
    if (!draft.name.trim() || draft.price <= 0) { setFormError('กรุณากรอกชื่อเมนูและราคามากกว่า 0'); return; }
    const ok = editingId ? await updateProduct(editingId, draft) : await createProduct(draft);
    if (ok) setModalVisible(false);
  };

  const remove = (product: Product) => Alert.alert('ลบเมนูนี้?', `ต้องการลบ “${product.name}” ออกจากระบบหรือไม่`, [{ text: 'ยกเลิก', style: 'cancel' }, { text: 'ลบเมนู', style: 'destructive', onPress: () => { void deleteProduct(product.id); } }]);

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.list} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}><View><Text style={styles.eyebrow}>PRODUCT OPERATIONS</Text><Text style={styles.title}>จัดการเมนู</Text><Text style={styles.subtitle}>{canManage ? 'เพิ่ม แก้ไข ค้นหา และควบคุมสถานะขาย' : 'ค้นหาและดูรายการเมนู'}</Text></View>{canManage && <Pressable onPress={openCreate} style={styles.addButton}><Ionicons color="#FFF" name="add" size={18} /><Text style={styles.addButtonText}>เพิ่มเมนู</Text></Pressable>}</View>

        {!!(error || formError) && <View style={styles.errorBox}><Ionicons color={appColors.danger} name="warning-outline" size={17} /><Text style={styles.errorText}>{formError || error}</Text></View>}

        <View style={styles.searchBox}><Ionicons color={appColors.muted} name="search-outline" size={18} /><TextInput value={query} onChangeText={setQuery} placeholder="ค้นหาชื่อเมนู รายละเอียด หรือหมวดหมู่" placeholderTextColor={appColors.subtle} style={styles.searchInput} /><Text style={styles.resultCount}>{visibleProducts.length}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>

        <View style={styles.listHeading}><Text style={styles.listTitle}>รายการเมนู</Text><Text style={styles.listCount}>{visibleProducts.length} รายการ</Text></View>
        {visibleProducts.map((product) => <ProductCard key={product.id} product={product} busy={saving} canManage={canManage} onEdit={() => openEdit(product)} onDelete={() => remove(product)} onToggle={() => { void toggleProduct(product); }} />)}
        {visibleProducts.length === 0 && <View style={styles.empty}><View style={styles.emptyIcon}><Ionicons color={appColors.primary} name="restaurant-outline" size={28} /></View><Text style={styles.emptyTitle}>ไม่พบเมนู</Text><Text style={styles.emptyText}>ลองเปลี่ยนคำค้นหา หรือเพิ่มเมนูใหม่เพื่อเริ่มต้น</Text>{canManage && <Pressable onPress={openCreate} style={styles.emptyButton}><Text style={styles.emptyButtonText}>เพิ่มเมนูแรก</Text></Pressable>}</View>}
      </ScrollView>

      <ProductModal visible={modalVisible} editing={Boolean(editingId)} draft={draft} error={formError} saving={saving} onChange={setDraft} onClose={() => setModalVisible(false)} onSave={() => { void save(); }} />
    </View>
  );
}

function ProductCard({ product, busy, canManage, onEdit, onDelete, onToggle }: { product: Product; busy: boolean; canManage: boolean; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
  return <View style={styles.productCard}>
    <View style={styles.productImageWrap}>{product.imageUrl ? <Image source={{ uri: product.imageUrl }} style={styles.productImage} /> : <View style={styles.noImage}><Ionicons color={appColors.subtle} name="image-outline" size={22} /><Text style={styles.noImageText}>ไม่มีรูป</Text></View>}</View>
    <View style={styles.productCopy}><View style={styles.nameLine}><Text numberOfLines={2} style={styles.productName}>{product.name}</Text><View style={[styles.status, product.available ? styles.statusOn : styles.statusOff]}><Text style={[styles.statusText, product.available ? styles.statusTextOn : styles.statusTextOff]}>{product.available ? 'พร้อมขาย' : 'ปิดขาย'}</Text></View></View><Text style={styles.category}>{product.category}</Text><Text numberOfLines={2} style={styles.description}>{product.description || 'ยังไม่มีรายละเอียด'}</Text><Text style={styles.price}>฿{product.price.toLocaleString('th-TH')}</Text></View>
    {canManage && <View style={styles.actions}><Pressable disabled={busy} onPress={onEdit} style={styles.action}><Ionicons color={appColors.primary} name="create-outline" size={18} /></Pressable><Pressable disabled={busy} onPress={onToggle} style={styles.action}><Ionicons color={appColors.mint} name={product.available ? 'eye-off-outline' : 'eye-outline'} size={18} /></Pressable><Pressable disabled={busy} onPress={onDelete} style={[styles.action, styles.deleteAction]}><Ionicons color={appColors.danger} name="trash-outline" size={18} /></Pressable></View>}
  </View>;
}

function ProductModal({ visible, editing, draft, error, saving, onChange, onClose, onSave }: { visible: boolean; editing: boolean; draft: ProductInput; error: string; saving: boolean; onChange: (draft: ProductInput) => void; onClose: () => void; onSave: () => void }) {
  return <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}><View style={styles.overlay}><ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled"><View style={styles.modalCard}><View style={styles.modalHeader}><View><Text style={styles.modalEyebrow}>{editing ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</Text><Text style={styles.modalTitle}>{editing ? 'แก้ไขเมนู' : 'เพิ่มเมนูอาหาร'}</Text></View><Pressable onPress={onClose}><Ionicons color={appColors.muted} name="close" size={24} /></Pressable></View>
    <Text style={styles.fieldLabel}>ชื่อเมนู *</Text><TextInput value={draft.name} onChangeText={(name) => onChange({ ...draft, name })} placeholder="เช่น ข้าวกะเพรา" placeholderTextColor={appColors.subtle} style={styles.input} />
    <Text style={styles.fieldLabel}>ราคา (บาท) *</Text><TextInput keyboardType="decimal-pad" value={draft.price ? String(draft.price) : ''} onChangeText={(value) => onChange({ ...draft, price: Number(value.replace(/[^0-9.]/g, '')) || 0 })} placeholder="0" placeholderTextColor={appColors.subtle} style={styles.input} />
    <Text style={styles.fieldLabel}>หมวดหมู่</Text><View style={styles.categoryRow}>{productCategories.map((category) => <Pressable key={category} onPress={() => onChange({ ...draft, category })} style={[styles.categoryChip, draft.category === category && styles.categoryChipActive]}><Text style={[styles.categoryChipText, draft.category === category && styles.categoryChipTextActive]}>{category}</Text></Pressable>)}</View>
    <Text style={styles.fieldLabel}>รายละเอียด</Text><TextInput multiline value={draft.description} onChangeText={(description) => onChange({ ...draft, description })} placeholder="รายละเอียดสั้น ๆ ของเมนู" placeholderTextColor={appColors.subtle} style={[styles.input, styles.textarea]} />
    <Text style={styles.fieldLabel}>URL รูปอาหาร</Text><TextInput autoCapitalize="none" value={draft.imageUrl} onChangeText={(imageUrl) => onChange({ ...draft, imageUrl })} placeholder="https://..." placeholderTextColor={appColors.subtle} style={styles.input} />
    <Pressable onPress={() => onChange({ ...draft, available: !draft.available })} style={styles.availableRow}><View style={[styles.checkbox, draft.available && styles.checkboxActive]}>{draft.available && <Ionicons color="#FFF" name="checkmark" size={14} />}</View><Text style={styles.availableText}>เปิดขายเมนูนี้</Text></Pressable>
    {!!error && <Text style={styles.modalError}>{error}</Text>}
    <View style={styles.modalActions}><Pressable disabled={saving} onPress={onClose} style={styles.cancelButton}><Text style={styles.cancelText}>ยกเลิก</Text></Pressable><Pressable disabled={saving} onPress={onSave} style={[styles.saveButton, saving && styles.disabled]}>{saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveText}>{editing ? 'บันทึกการแก้ไข' : 'เพิ่มเมนู'}</Text>}</Pressable></View>
  </View></ScrollView></View></Modal>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: appColors.background, flex: 1 },
  list: { flex: 1 },
  content: { alignSelf: 'center', maxWidth: 980, padding: appSpacing.page, paddingBottom: 40, width: '100%' },
  header: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  eyebrow: { color: appColors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginBottom: 7 },
  title: { color: appColors.ink, fontSize: 28, fontWeight: '900', letterSpacing: -0.7 },
  subtitle: { color: appColors.muted, fontSize: 11, marginTop: 5 },
  addButton: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: appRadius.control, flexDirection: 'row', gap: 5, justifyContent: 'center', minHeight: 44, paddingHorizontal: 13 },
  addButtonText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  errorBox: { alignItems: 'center', backgroundColor: appColors.dangerSoft, borderRadius: appRadius.control, flexDirection: 'row', gap: 8, marginBottom: 14, padding: 12 },
  errorText: { color: appColors.danger, flex: 1, fontSize: 11, lineHeight: 17 },
  searchBox: { alignItems: 'center', backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.control, borderWidth: 1, flexDirection: 'row', minHeight: 49, paddingHorizontal: 13 },
  searchInput: { color: appColors.ink, flex: 1, fontSize: 12, marginLeft: 8 },
  resultCount: { color: appColors.primary, fontSize: 12, fontWeight: '900' },
  filterRow: { gap: 8, paddingBottom: 24, paddingTop: 13 },
  filter: { backgroundColor: '#F0F1F6', borderRadius: appRadius.pill, paddingHorizontal: 15, paddingVertical: 9 },
  filterActive: { backgroundColor: appColors.primarySoft },
  filterText: { color: appColors.muted, fontSize: 10, fontWeight: '800' },
  filterTextActive: { color: appColors.primary },
  listHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  listTitle: { color: appColors.ink, fontSize: 17, fontWeight: '900' },
  listCount: { color: appColors.muted, fontSize: 10, fontWeight: '800' },
  productCard: { alignItems: 'center', backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, flexDirection: 'row', gap: 10, marginBottom: 10, padding: 12 },
  productImageWrap: { backgroundColor: '#F2F3F7', borderRadius: 12, height: 82, overflow: 'hidden', width: 92 },
  productImage: { height: '100%', width: '100%' },
  noImage: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  noImageText: { color: appColors.subtle, fontSize: 8, marginTop: 4 },
  productCopy: { flex: 1, minWidth: 0 },
  nameLine: { alignItems: 'flex-start', flexDirection: 'row', gap: 7 },
  productName: { color: appColors.ink, flex: 1, fontSize: 13, fontWeight: '900' },
  category: { color: appColors.primary, fontSize: 10, fontWeight: '800', marginTop: 4 },
  description: { color: appColors.muted, fontSize: 10, lineHeight: 15, marginTop: 4 },
  price: { color: appColors.ink, fontSize: 14, fontWeight: '900', marginTop: 5 },
  status: { borderRadius: appRadius.pill, paddingHorizontal: 7, paddingVertical: 4 },
  statusOn: { backgroundColor: appColors.mintSoft },
  statusOff: { backgroundColor: '#F1F2F5' },
  statusText: { fontSize: 8, fontWeight: '900' },
  statusTextOn: { color: appColors.mint },
  statusTextOff: { color: appColors.muted },
  actions: { gap: 5 },
  action: { alignItems: 'center', backgroundColor: '#F2EFFF', borderRadius: 9, height: 34, justifyContent: 'center', width: 34 },
  deleteAction: { backgroundColor: appColors.dangerSoft },
  empty: { alignItems: 'center', backgroundColor: appColors.surface, borderColor: appColors.border, borderRadius: appRadius.card, borderWidth: 1, padding: 34 },
  emptyIcon: { alignItems: 'center', backgroundColor: appColors.primarySoft, borderRadius: 18, height: 58, justifyContent: 'center', width: 58 },
  emptyTitle: { color: appColors.ink, fontSize: 16, fontWeight: '900', marginTop: 14 },
  emptyText: { color: appColors.muted, fontSize: 11, lineHeight: 18, marginTop: 6, textAlign: 'center' },
  emptyButton: { backgroundColor: appColors.primary, borderRadius: appRadius.control, marginTop: 18, minHeight: 43, paddingHorizontal: 16, justifyContent: 'center' },
  emptyButtonText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  overlay: { backgroundColor: 'rgba(21,22,29,0.55)', flex: 1 },
  modalScroll: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  modalCard: { alignSelf: 'center', backgroundColor: appColors.surface, borderRadius: 20, maxWidth: 580, padding: 22, width: '100%' },
  modalHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  modalEyebrow: { color: appColors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  modalTitle: { color: appColors.ink, fontSize: 21, fontWeight: '900', marginTop: 4 },
  fieldLabel: { color: appColors.ink, fontSize: 11, fontWeight: '900', marginBottom: 7, marginTop: 14 },
  input: { borderColor: appColors.border, borderRadius: appRadius.control, borderWidth: 1, color: appColors.ink, fontSize: 13, minHeight: 46, paddingHorizontal: 12 },
  textarea: { minHeight: 78, paddingTop: 12, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  categoryChip: { backgroundColor: '#F1F2F6', borderRadius: 9, paddingHorizontal: 11, paddingVertical: 9 },
  categoryChipActive: { backgroundColor: appColors.primarySoft },
  categoryChipText: { color: appColors.muted, fontSize: 10, fontWeight: '800' },
  categoryChipTextActive: { color: appColors.primary },
  availableRow: { alignItems: 'center', flexDirection: 'row', marginTop: 18 },
  checkbox: { alignItems: 'center', borderColor: '#CBD0DB', borderRadius: 6, borderWidth: 1, height: 21, justifyContent: 'center', width: 21 },
  checkboxActive: { backgroundColor: appColors.primary, borderColor: appColors.primary },
  availableText: { color: appColors.ink, fontSize: 12, fontWeight: '800', marginLeft: 8 },
  modalError: { color: appColors.danger, fontSize: 11, marginTop: 11 },
  modalActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 22 },
  cancelButton: { alignItems: 'center', borderColor: appColors.border, borderRadius: appRadius.control, borderWidth: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: 17 },
  cancelText: { color: appColors.muted, fontSize: 11, fontWeight: '900' },
  saveButton: { alignItems: 'center', backgroundColor: appColors.primary, borderRadius: appRadius.control, justifyContent: 'center', minHeight: 44, minWidth: 108, paddingHorizontal: 16 },
  saveText: { color: '#FFF', fontSize: 11, fontWeight: '900' },
  disabled: { opacity: 0.55 },
});
