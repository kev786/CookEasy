import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type RootStackParamList = {
  Home: undefined;
  Shopping: undefined;
  Stock: undefined;
  Profile: undefined;
  Recipes: undefined;
  AddRecipe: { recipe?: any };
  RecipeDetail: { recipe: any };
  AddShoppingItem: undefined;
  AIGenerate: undefined;
  AddStock: undefined;
  EditStock: { item: { name: string; quantity: string; expiry: string; status: 'good' | 'warning' | 'urgent' }; itemIndex: number };
  EditRecipe: { recipe: any };
  MarketMap: undefined;
};

export interface Recipe {
  id?: string;
  name: string;
  image?: string;
  time: string;
  difficulty: string;
  rating?: number;
  reviews?: any[];
  calories?: number;
  budget?: number;
  servings: number;
  isPersonal?: boolean;
  creator?: string | null;
  description?: string;
  ingredients?: { name: string; quantity: number; unit: string; available: boolean }[];
  steps?: { title: string; instruction: string; time: number; image?: string }[];
  tips?: string[];
  nutrition?: { calories: number; proteins: number; carbs: number; fats: number };
}

// Corrected: ShoppingItem is now a standalone interface with new fields
export interface ShoppingItem {
  id: string;
  item: string;
  category: string;
  bought: boolean;
  quantity: number;   // Nouvelle propriété: quantité de l'article
  unit: string;       // Nouvelle propriété: unité de mesure (ex: 'kg', 'litre', 'unité')
  unitPrice: number;  // Nouvelle propriété: prix par unité
  priceEstimate: number; // Calculé: quantity * unitPrice
}

// New: Interface for organizing multiple shopping lists
export interface ShoppingListEntry {
  id: string; // Unique ID for the list (e.g., 'week1', 'monday')
  name: string; // e.g., "Liste de la Semaine 1", "Course du Lundi"
  date?: string; // Optional: "YYYY-MM-DD" or "Semaine X"
  items: ShoppingItem[];
}

export type StackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;