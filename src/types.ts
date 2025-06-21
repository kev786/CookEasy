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

export type StackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
