import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Alert, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { db } from '../services/firebase';
import { collection, onSnapshot, doc, deleteDoc } from '@react-native-firebase/firestore'; 

type Props = NativeStackScreenProps<RootStackParamList, 'Recipes'>;

interface Recipe {
  id: string;
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

const RecipesScreen: React.FC<Props> = ({ navigation }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'recipes'), (querySnapshot) => {
      const recipesList: Recipe[] = [];
      querySnapshot.forEach((doc) => {
        recipesList.push({ id: doc.id, ...doc.data() } as Recipe);
      });
      setRecipes(recipesList);
      setFilteredRecipes(recipesList); 
    });

    return () => unsubscribe(); 
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredRecipes(recipes);
    } else {
      const filtered = recipes.filter((recipe) =>
        recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRecipes(filtered);
    }
  }, [searchQuery, recipes]);

  const addToShoppingList = (recipeId: string) => {
    Alert.alert('Info', `Ajouter les ingrédients de la recette ${recipeId} à la liste de courses (à implémenter).`);
  };

  const handleRecipePress = (recipe: Recipe) => {
    navigation.navigate('RecipeDetail', { recipe });
  };

  /**
   * Gère la modification d'une recette.
   * Navigue vers EditRecipeScreen en lui passant l'objet recette.
   * @param recipe L'objet recette à modifier.
   */
  const handleEditRecipe = (recipe: Recipe) => {
    // MODIFICATION ICI : Navigue vers le nouvel écran EditRecipe
    navigation.navigate('EditRecipe', { recipe });
  };

  const handleDeleteRecipe = (recipeId: string, recipeName: string) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer la recette "${recipeName}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'recipes', recipeId));
              Alert.alert('Succès', 'Recette supprimée avec succès !');
            } catch (error) {
              console.error('Erreur lors de la suppression de la recette :', error);
              Alert.alert('Erreur', 'Échec de la suppression de la recette.');
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Recettes</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Barre de recherche */}
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une recette..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddRecipe', {})}
          >
            <LinearGradient colors={['#f97316', '#ef4444']} style={styles.gradientButton}>
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={styles.buttonText}>Créer une recette</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Info', 'Suggestions IA à implémenter.')}
          >
            <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.gradientButton}>
              <Text style={styles.buttonText}>✨ Suggestions IA</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Liste des recettes */}
        <FlatList
          data={filteredRecipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.recipeCard, item.isPersonal && styles.personalRecipeCard]}>
              {item.isPersonal && (
                <View style={styles.personalBadge}>
                  <Text style={styles.personalBadgeText}>Ma recette</Text>
                </View>
              )}
              <View style={styles.recipeContainer}>
                <TouchableOpacity
                  style={styles.touchableRecipe}
                  onPress={() => handleRecipePress(item)}
                >
                  <View style={styles.recipeContent}>
                    {item.image ? (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.recipeImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={styles.recipeImage}>🍳</Text>
                    )}
                    <View style={styles.recipeDetails}>
                      <Text style={styles.recipeName}>{item.name}</Text>
                      {item.isPersonal && item.creator && (
                        <Text style={styles.creatorText}>Créé par {item.creator}</Text>
                      )}
                      <View style={styles.recipeInfo}>
                        <Text style={styles.infoText}>⏱️ {item.time}</Text>
                        <Text style={styles.infoText}>📈 {item.difficulty}</Text>
                        <Text style={styles.infoText}>🔥 {item.calories} cal</Text>
                      </View>
                      <View style={styles.recipeStats}>
                        <Text style={styles.statText}>💰 {item.budget}FCFA</Text>
                        <Text style={styles.statText}>
                          📦 {item.availableIngredients}/{item.ingredients.length} dispo
                        </Text>
                      </View>
                      <View style={styles.ingredientsList}>
                        {item.ingredients.slice(0, 3).map((ingredient: string, idx: number) => (
                          <View key={idx} style={styles.ingredientTag}>
                            <Text style={styles.ingredientText}>{ingredient}</Text>
                          </View>
                        ))}
                        {item.ingredients.length > 3 && (
                          <View style={styles.ingredientTag}>
                            <Text style={styles.ingredientText}>+{item.ingredients.length - 3}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
                <View style={styles.recipeActions}>
                  {/* Bouton Modifier */}
                  <TouchableOpacity
                    style={styles.actionButtonCircle}
                    onPress={() => handleEditRecipe(item)}
                  >
                    <MaterialCommunityIcons name="pencil" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                  {/* Bouton Supprimer */}
                  <TouchableOpacity
                    style={styles.actionButtonCircle}
                    onPress={() => handleDeleteRecipe(item.id, item.name)}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                  {/* Bouton Ajouter à la liste de courses */}
                  <TouchableOpacity
                    style={styles.shoppingCartIcon}
                    onPress={() => addToShoppingList(item.id)}
                  >
                    <MaterialCommunityIcons name="cart-outline" size={20} color="#3b82f6" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Aucune recette disponible.</Text>}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginHorizontal: 8 },
  profileIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
    elevation: 2,
  },
  searchIcon: { marginLeft: 12 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  actionButton: { flex: 1, marginHorizontal: 8 },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#fff', marginLeft: 8 },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
  },
  personalRecipeCard: { position: 'relative' },
  personalBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffedd5',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    zIndex: 1, 
  },
  personalBadgeText: { fontSize: 12, fontWeight: '500', color: '#f97316' },
  recipeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  touchableRecipe: { flex: 1 },
  recipeContent: { flexDirection: 'row', alignItems: 'flex-start' },
  recipeImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 16,
  },
  recipeDetails: { flex: 1 },
  recipeName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  creatorText: { fontSize: 12, color: '#f97316', marginBottom: 4 },
  recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoText: { fontSize: 12, color: '#6B7280' },
  recipeStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statText: { fontSize: 12, color: '#16a34a' },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  ingredientTag: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  ingredientText: { fontSize: 12, color: '#6B7280' },
  recipeActions: {
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingTop: 8,
    gap: 8, 
  },
  actionButtonCircle: { 
    backgroundColor: '#E5E7EB',
    borderRadius: 20, 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  shoppingCartIcon: {
    padding: 10, 
    borderRadius: 20, 
    backgroundColor: '#E5E7EB', 
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 20 },
});

export default RecipesScreen;
