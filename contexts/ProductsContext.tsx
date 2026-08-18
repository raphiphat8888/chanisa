import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import seedProducts from '@/data/products.json';
import { useAuth } from '@/contexts/AuthContext';
import { apiConfigured, createProduct as apiCreateProduct, deleteProduct as apiDeleteProduct, getProducts, updateProduct as apiUpdateProduct } from '@/lib/api';
import type { Product, ProductInput } from '@/types/product';

type ProductContextValue = {
  products: Product[];
  loading: boolean;
  saving: boolean;
  error: string;
  refresh: () => Promise<void>;
  createProduct: (input: ProductInput) => Promise<boolean>;
  updateProduct: (id: string, input: ProductInput) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  toggleProduct: (product: Product) => Promise<boolean>;
};

const ProductContext = createContext<ProductContextValue | null>(null);
const localSeed = seedProducts as Product[];

export function ProductsProvider({ children }: React.PropsWithChildren) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    if (!apiConfigured || user.isDemo) {
      setProducts(localSeed);
      setLoading(false);
      return;
    }

    try {
      setProducts(await getProducts());
    } catch (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'โหลดเมนูไม่สำเร็จ');
      setProducts([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createProduct = useCallback(async (input: ProductInput) => {
    setSaving(true);
    setError('');
    if (!apiConfigured || user?.isDemo) {
      setProducts((current) => [{ ...input, id: `local-${Date.now()}` }, ...current]);
      setSaving(false);
      return true;
    }
    try {
      const product = await apiCreateProduct(input);
      setProducts((current) => [product, ...current]);
    } catch (insertError) {
      setError(insertError instanceof Error ? insertError.message : 'เพิ่มเมนูไม่สำเร็จ');
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  }, [user]);

  const updateProduct = useCallback(async (id: string, input: ProductInput) => {
    setSaving(true);
    setError('');
    if (!apiConfigured || user?.isDemo) {
      setProducts((current) => current.map((product) => product.id === id ? { ...input, id } : product));
      setSaving(false);
      return true;
    }
    try {
      const product = await apiUpdateProduct(id, input);
      setProducts((current) => current.map((item) => item.id === id ? product : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'แก้ไขเมนูไม่สำเร็จ');
      setSaving(false);
      return false;
    }
    setSaving(false);
    return true;
  }, [user]);

  const deleteProduct = useCallback(async (id: string) => {
    setSaving(true);
    setError('');
    if (!apiConfigured || user?.isDemo) {
      setProducts((current) => current.filter((product) => product.id !== id));
      setSaving(false);
      return true;
    }
    try {
      await apiDeleteProduct(id);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'ลบเมนูไม่สำเร็จ');
      setSaving(false);
      return false;
    }
    setProducts((current) => current.filter((product) => product.id !== id));
    setSaving(false);
    return true;
  }, [user]);

  const toggleProduct = useCallback(async (product: Product) => updateProduct(product.id, { ...product, available: !product.available }), [updateProduct]);

  const value = useMemo<ProductContextValue>(() => ({ products, loading, saving, error, refresh, createProduct, updateProduct, deleteProduct, toggleProduct }), [createProduct, deleteProduct, error, loading, products, refresh, saving, toggleProduct, updateProduct]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used inside ProductsProvider');
  return context;
}
