import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot } from '@react-native-firebase/firestore';
import { onAuthStateChanged } from '@react-native-firebase/auth';
// Assurez-vous d'avoir toutes ces interfaces dans types.ts
import { ShoppingListEntry, ShoppingItem, StockItem, Recipe, FamilyMember, FamilyProfile } from './types'; // Importez toutes les interfaces de types.ts

// Déplacez ces interfaces dans types.ts si elles ne le sont pas déjà
// interface FamilyMember {
//   name: string;
//   age: number;
//   activity: string;
//   preferences: string[];
// }

// interface FamilyProfile {
//   name: string;
//   members: FamilyMember[];
// }

// interface Recipe {
//   id: number;
//   name: string;
//   time: string;
//   difficulty: string;
//   image?: string;
//   calories: number;
//   ingredients: string[];
//   isPersonal: boolean;
//   budget: number;
//   availableIngredients: number;
//   creator?: string;
// }

// StockItem est déjà dans types.ts

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
  shoppingLists: ShoppingListEntry[];
  addShoppingList: (name: string, items: ShoppingItem[], date?: string) => void;
  updateShoppingItem: (listId: string, itemId: string, updates: Partial<ShoppingItem>) => void;
  removeShoppingList: (listId: string) => void; // <--- NOUVELLE FONCTION AJOUTÉE ICI
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
      servings: 4, // Added missing property for consistency with types.ts Recipe
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
      servings: 2, // Added missing property
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
      servings: 2, // Added missing property
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
      servings: 4, // Added missing property
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
      servings: 4, // Added missing property
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
      servings: 4, // Added missing property
    },
  ]);

  // Nouvelle gestion des listes de courses avec les nouvelles propriétés d'ShoppingItem
  const [shoppingLists, setShoppingLists] = useState<ShoppingListEntry[]>([
    {
      id: 'list-semaine-1',
      name: 'Liste de la Semaine 1',
      date: 'Semaine 1',
      items: [
        { id: 'item-1-pates', item: 'Pâtes', bought: false, category: 'Féculents', quantity: 0.5, unit: 'kg', unitPrice: 3.00, priceEstimate: 1.50 },
        { id: 'item-1-lardons', item: 'Lardons', bought: true, category: 'Viande', quantity: 0.2, unit: 'kg', unitPrice: 15.00, priceEstimate: 3.00 },
        { id: 'item-1-oeufs', item: 'Œufs', bought: false, category: 'Frais', quantity: 6, unit: 'pièces', unitPrice: 0.33, priceEstimate: 2.00 },
        { id: 'item-1-parmesan', item: 'Parmesan', bought: false, category: 'Fromage', quantity: 0.1, unit: 'kg', unitPrice: 40.00, priceEstimate: 4.00 },
      ],
    },
    {
      id: 'list-lundi',
      name: 'Course du Lundi',
      date: 'Lundi 24 Juin',
      items: [
        { id: 'item-2-salade', item: 'Salade verte', bought: true, category: 'Légumes', quantity: 1, unit: 'unité', unitPrice: 1.20, priceEstimate: 1.20 },
        { id: 'item-2-poulet', item: 'Poulet', bought: false, category: 'Viande', quantity: 1, unit: 'kg', unitPrice: 6.00, priceEstimate: 6.00 },
        { id: 'item-2-lait', item: 'Lait', bought: false, category: 'Frais', quantity: 1, unit: 'litre', unitPrice: 1.00, priceEstimate: 1.00 },
      ],
    },
  ]);

  // Fonction pour ajouter une nouvelle liste de courses
  const addShoppingList = (name: string, items: ShoppingItem[], date?: string) => {
    const newId = `list-${Date.now()}`; // Générer un ID unique
    setShoppingLists((prevLists) => [...prevLists, { id: newId, name, items, date }]);
  };

  // Fonction pour mettre à jour un article dans une liste de courses spécifique
  const updateShoppingItem = (listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setShoppingLists((prevLists) =>
      prevLists.map((list) =>
        list.id === listId
          ? {
              ...list,
              items: list.items.map((item) =>
                item.id === itemId ? { ...item, ...updates } : item
              ),
            }
          : list
      )
    );
  };

  // <--- NOUVELLE FONCTION DE SUPPRESSION DE LISTE AJOUTÉE ICI --->
  const removeShoppingList = (listId: string) => {
    setShoppingLists((prevLists) => prevLists.filter((list) => list.id !== listId));
  };
  // <--------------------------------------------------------------->

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
    { id: 'stock-riz', name: 'Riz', quantity: 2, unit: 'kg', expiryDate: '2025-08-15', status: 'good', category: 'Féculents' }, // Updated to match StockItem in types.ts
    { id: 'stock-huile', name: 'Huile d’olive', quantity: 0.5, unit: 'litre', expiryDate: '2025-12-20', status: 'good', category: 'Autres' }, // Updated
    { id: 'stock-lait', name: 'Lait', quantity: 1, unit: 'litre', expiryDate: '2025-05-30', status: 'warning', category: 'Produits Laitiers' }, // Updated
    { id: 'stock-yaourts', name: 'Yaourts', quantity: 8, unit: 'pots', expiryDate: '2025-05-26', status: 'urgent', category: 'Produits Laitiers' }, // Updated
    { id: 'stock-pommes-terre', name: 'Pommes de terre', quantity: 1.5, unit: 'kg', expiryDate: '2025-06-10', status: 'good', category: 'Légumes' }, // Updated
    { id: 'stock-fromage', name: 'Fromage râpé', quantity: 0.2, unit: 'kg', expiryDate: '2025-06-05', status: 'good', category: 'Fromage' }, // Updated
    { id: 'stock-oeufs', name: 'Œufs', quantity: 6, unit: 'pièces', expiryDate: '2025-06-01', status: 'good', category: 'Frais' }, // Updated
    { id: 'stock-pates', name: 'Pâtes', quantity: 0.5, unit: 'kg', expiryDate: '2025-10-15', status: 'good', category: 'Féculents' }, // Updated
    { id: 'stock-ndole', name: 'Ndolé', quantity: 1, unit: 'kg', expiryDate: '2025-07-01', status: 'good', category: 'Légumes' }, // Updated
    { id: 'stock-plantains', name: 'Plantains', quantity: 6, unit: 'unité', expiryDate: '2025-06-15', status: 'good', category: 'Féculents' }, // Updated
    { id: 'stock-arachides', name: 'Arachides', quantity: 0.4, unit: 'kg', expiryDate: '2025-08-01', status: 'good', category: 'Légumineuses' }, // Updated
    { id: 'stock-poisson-fume', name: 'Poisson fumé', quantity: 0.4, unit: 'kg', expiryDate: '2025-06-10', status: 'good', category: 'Viande' }, // Updated
    { id: 'stock-huile-palme', name: 'Huile de palme', quantity: 0.25, unit: 'litre', expiryDate: '2025-09-01', status: 'good', category: 'Autres' }, // Updated
    { id: 'stock-oignons', name: 'Oignons', quantity: 5, unit: 'unité', expiryDate: '2025-06-20', status: 'good', category: 'Légumes' }, // Updated
    { id: 'stock-ail', name: 'Ail', quantity: 6, unit: 'gousses', expiryDate: '2025-06-25', status: 'good', category: 'Légumes' }, // Updated
    { id: 'stock-haricots-koki', name: 'Haricots Koki', quantity: 1, unit: 'kg', expiryDate: '2025-07-15', status: 'good', category: 'Légumineuses' }, // Updated
    { id: 'stock-feuilles-bananier', name: 'Feuilles de bananier', quantity: 10, unit: 'unité', expiryDate: '2025-06-30', status: 'good', category: 'Autres' }, // Updated
    { id: 'stock-piment', name: 'Piment', quantity: 0.1, unit: 'kg', expiryDate: '2025-06-18', status: 'good', category: 'Autres' }, // Updated
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
      value={{
        familyProfile,
        recipes,
        setRecipes,
        shoppingLists,
        addShoppingList,
        updateShoppingItem,
        removeShoppingList, // <--- AJOUTÉE ICI
        stock,
        setStock,
        aiSuggestions,
      }}
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