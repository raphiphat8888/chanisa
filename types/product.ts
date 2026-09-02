export const productCategories = ['จานหลัก', 'เส้น', 'ของทานเล่น', 'เครื่องดื่ม', 'ของหวาน'] as const;

export type ProductCategory = (typeof productCategories)[number];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  imageUrl: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ProductInput = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;
