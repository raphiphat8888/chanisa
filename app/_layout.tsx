import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import { ProductsProvider } from '@/contexts/ProductsContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ProductsProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <StatusBar style="dark" />
      </ProductsProvider>
    </AuthProvider>
  );
}
