import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { onAuthStateChanged } from '@react-native-firebase/auth';

interface FamilyMember {
  name: string;
  age: number;
  activity: string;
  preferences: string[];
}

interface FamilyProfile {
  name: string;
  members: FamilyMember[];
}

interface Recipe {
  id: number;
  name: string;
  time: string;
  difficulty: string;
  image?: string;
  calories: number;
  ingredients: string[];
  isPersonal: boolean;
  budget: number;
  availableIngredients: number;
  creator?: string;
}

interface ShoppingItem {
  item: string;
  bought: boolean;
  category: string;
}

interface StockItem {
  name: string;
  quantity: string;
  expiry: string;
  status: 'good' | 'warning' | 'urgent';
}

interface AISuggestion {
  name: string;
  reason: string;
  budget: string;
  time: string;
  match: string;
  ingredients: string[];
}

interface AppContextType {
  familyProfile: FamilyProfile;
  recipes: Recipe[];
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>;
  shoppingList: ShoppingItem[];
  setShoppingList: React.Dispatch<React.SetStateAction<ShoppingItem[]>>;
  stock: StockItem[];
  setStock: React.Dispatch<React.SetStateAction<StockItem[]>>;
  aiSuggestions: AISuggestion[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [familyProfile, setFamilyProfile] = useState<FamilyProfile>({
    name: 'Famille',
    members: [],
  });

  const [recipes, setRecipes] = useState<Recipe[]>([
    {
      id: 1,
      name: 'Pâtes Carbonara',
      time: '25 min',
      difficulty: 'Facile',
      image: '🍝',
      calories: 650,
      ingredients: ['Pâtes', 'Lardons', 'Œufs', 'Parmesan', 'Crème'],
      isPersonal: false,
      budget: 8.50,
      availableIngredients: 3,
    },
    {
      id: 2,
      name: 'Salade César',
      time: '15 min',
      difficulty: 'Très facile',
      image: '🥗',
      calories: 320,
      ingredients: ['Salade', 'Poulet', 'Parmesan', 'Croûtons', 'Sauce César'],
      isPersonal: false,
      budget: 6.20,
      availableIngredients: 2,
    },
    {
      id: 3,
      name: 'Saumon Grillé',
      time: '30 min',
      difficulty: 'Moyen',
      image: '🐟',
      calories: 450,
      ingredients: ['Saumon', 'Légumes', 'Huile d’olive', 'Citron', 'Herbes'],
      isPersonal: false,
      budget: 12.80,
      availableIngredients: 4,
    },
    {
      id: 4,
      name: 'Plantain Ndolé',
      time: '1h 15 min',
      difficulty: 'Moyen',
      image: '🍌',
      calories: 600,
      ingredients: [
        'Ndolé (500g)',
        'Plantains (4)',
        'Arachides (200g)',
        'Poisson fumé (200g)',
        'Huile de palme (100ml)',
        'Oignons (2)',
        'Ail (3 gousses)',
        'Sel',
        'Poivre',
      ],
      isPersonal: true,
      budget: 9.00,
      availableIngredients: 4,
      creator: 'Famille',
    },
    {
      id: 5,
      name: 'Riz au Ndolé',
      time: '1h 30 min',
      difficulty: 'Moyen',
      image: '🍚',
      calories: 700,
      ingredients: [
        'Ndolé (500g)',
        'Riz (500g)',
        'Arachides (200g)',
        'Poisson fumé (200g)',
        'Huile de palme (100ml)',
        'Oignons (2)',
        'Ail (3 gousses)',
        'Sel',
        'Poivre',
      ],
      isPersonal: true,
      budget: 10.00,
      availableIngredients: 3,
      creator: 'Famille',
    },
    {
      id: 6,
      name: 'Koki',
      time: '2h',
      difficulty: 'Difficile',
      image: '🌿',
      calories: 550,
      ingredients: [
        'Haricots Koki (500g)',
        'Huile de palme (150ml)',
        'Feuilles de bananier',
        'Sel',
        'Piment (selon goût)',
        'Oignons (1)',
      ],
      isPersonal: true,
      budget: 7.50,
      availableIngredients: 2,
      creator: 'Famille',
    },
  ]);

  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([
    { item: 'Pâtes (500g)', bought: false, category: 'Féculents' },
    { item: 'Lardons (200g)', bought: true, category: 'Viande' },
    { item: 'Œufs (6 pièces)', bought: false, category: 'Frais' },
    { item: 'Parmesan (100g)', bought: false, category: 'Fromage' },
    { item: 'Salade verte', bought: true, category: 'Légumes' },
  ]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);

        const unsubscribeFirestore = onSnapshot(
          userDocRef,
          (userDoc) => {
            if (userDoc.exists()) {
              const data = userDoc.data() as { firstName: string; lastName: string; members?: FamilyMember[] };
              setFamilyProfile({
                name: `${data.firstName} ${data.lastName}`,
                members: data.members || [],
              });
            } else {
              setFamilyProfile({
                name: user.displayName || user.email?.split('@')[0] || 'Famille',
                members: [],
              });
            }
          },
          (error) => {
            console.error('Erreur lors de la récupération des données Firestore:', error);
            setFamilyProfile({
              name: user.displayName || user.email?.split('@')[0] || 'Famille',
              members: [],
            });
          }
        );

        return () => unsubscribeFirestore();
      } else {
        setFamilyProfile({
          name: 'Famille',
          members: [],
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const [stock, setStock] = useState<StockItem[]>([
    { name: 'Riz', quantity: '2 kg', expiry: '2025-08-15', status: 'good' },
    { name: 'Huile d’olive', quantity: '500ml', expiry: '2025-12-20', status: 'good' },
    { name: 'Lait', quantity: '1L', expiry: '2025-05-30', status: 'warning' },
    { name: 'Yaourts', quantity: '8 pots', expiry: '2025-05-26', status: 'urgent' },
    { name: 'Pommes de terre', quantity: '1.5 kg', expiry: '2025-06-10', status: 'good' },
    { name: 'Fromage râpé', quantity: '200g', expiry: '2025-06-05', status: 'good' },
    { name: 'Œufs', quantity: '6 pièces', expiry: '2025-06-01', status: 'good' },
    { name: 'Pâtes', quantity: '500g', expiry: '2025-10-15', status: 'good' },
    { name: 'Ndolé', quantity: '1 kg', expiry: '2025-07-01', status: 'good' },
    { name: 'Plantains', quantity: '6', expiry: '2025-06-15', status: 'good' },
    { name: 'Arachides', quantity: '400g', expiry: '2025-08-01', status: 'good' },
    { name: 'Poisson fumé', quantity: '400g', expiry: '2025-06-10', status: 'good' },
    { name: 'Huile de palme', quantity: '250ml', expiry: '2025-09-01', status: 'good' },
    { name: 'Oignons', quantity: '5', expiry: '2025-06-20', status: 'good' },
    { name: 'Ail', quantity: '6 gousses', expiry: '2025-06-25', status: 'good' },
    { name: 'Haricots Koki', quantity: '1 kg', expiry: '2025-07-15', status: 'good' },
    { name: 'Feuilles de bananier', quantity: '10', expiry: '2025-06-30', status: 'good' },
    { name: 'Piment', quantity: '100g', expiry: '2025-06-18', status: 'good' },
  ]);

  const [aiSuggestions] = useState<AISuggestion[]>([
    {
      name: 'Gratin de Pommes de Terre',
      reason: 'Utilise 4 ingrédients de votre stock',
      budget: '3.50FCFA',
      time: '40 min',
      match: '95%',
      ingredients: ['Pommes de terre', 'Lait', 'Fromage râpé', 'Beurre'],
    },
    {
      name: 'Omelette aux Herbes',
      reason: 'Rapide et adapté au budget famille',
      budget: '2.80FCFA',
      time: '10 min',
      match: '88%',
      ingredients: ['Œufs', 'Herbes', 'Beurre', 'Fromage râpé'],
    },
    {
      name: 'Pâtes au Fromage',
      reason: 'Plat simple aimé des enfants',
      budget: '4.20FCFA',
      time: '15 min',
      match: '92%',
      ingredients: ['Pâtes', 'Fromage râpé', 'Lait', 'Beurre'],
    },
  ]);

  return (
    <AppContext.Provider
      value={{ familyProfile, recipes, setRecipes, shoppingList, setShoppingList, stock, setStock, aiSuggestions }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
