import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AIGenerate'>;

const AIGenerate: React.FC<Props> = ({ navigation }) => {
  const { recipes, shoppingList, setShoppingList } = useAppContext();
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);

  // Filtrer les recettes personnelles
  const personalRecipes = recipes.filter((recipe) => recipe.isPersonal);

  const handleGenerateList = () => {
    if (!selectedRecipe) {
      alert('Veuillez sélectionner une recette.');
      return;
    }

    // Ajouter les ingrédients de la recette sélectionnée à shoppingList
    const newItems = selectedRecipe.ingredients.map((ingredient: string) => ({
      item: ingredient,
      bought: false,
      category: getCategoryForIngredient(ingredient),
    }));

    // Éviter les doublons
    const updatedShoppingList = [...shoppingList];
    newItems.forEach((newItem: any) => {
      if (!updatedShoppingList.some((item) => item.item === newItem.item)) {
        updatedShoppingList.push(newItem);
      }
    });

    setShoppingList(updatedShoppingList);
    // Naviguer automatiquement vers ShoppingScreen pour voir la liste mise à jour
    navigation.navigate('Shopping');
  };

  const getCategoryForIngredient = (ingredient: string): string => {
    const lowerIngredient = ingredient.toLowerCase();
    if (['riz', 'pâtes', 'plantains'].includes(lowerIngredient)) {return 'Féculents';}
    if (['poulet', 'poisson', 'viande', 'lardons', 'poisson fumé'].includes(lowerIngredient)) {return 'Viande';}
    if (['tomates', 'salade', 'légumes', 'ndolé'].includes(lowerIngredient)) {return 'Légumes';}
    if (['fromage', 'parmesan'].includes(lowerIngredient)) {return 'Fromage';}
    if (['œufs', 'lait', 'crème'].includes(lowerIngredient)) {return 'Frais';}
    if (['haricots koki', 'arachides'].includes(lowerIngredient)) {return 'Légumineuses';}
    return 'Autres';
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Générer une liste avec l'IA</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Sélectionner une recette</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="chef-hat" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowRecipeModal(true)}
              >
                <Text style={styles.modalText}>
                  {selectedRecipe ? selectedRecipe.name : 'Choisir une recette'}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedRecipe && (
            <View style={styles.ingredientsContainer}>
              <Text style={styles.label}>Ingrédients à ajouter :</Text>
              {selectedRecipe.ingredients.map((ingredient: string, index: number) => (
                <Text key={index} style={styles.ingredientText}>
                  • {ingredient}
                </Text>
              ))}
              <Text style={styles.budgetText}>
                Budget estimé : {(selectedRecipe.budget * 656).toLocaleString()} FCFA
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateList}>
            <Text style={styles.generateButtonText}>Générer la liste</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showRecipeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRecipeModal(false)}
        >
          <View style={styles.modalContent}>
            {personalRecipes.length === 0 ? (
              <Text style={styles.noRecipesText}>Aucune recette personnelle trouvée.</Text>
            ) : (
              personalRecipes.map((recipe: any) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={[styles.modalItem, selectedRecipe?.id === recipe.id && styles.modalItemSelected]}
                  onPress={() => {
                    setSelectedRecipe(recipe);
                    setShowRecipeModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalItemText,
                      selectedRecipe?.id === recipe.id && styles.modalItemTextSelected,
                    ]}
                  >
                    {recipe.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContent: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginLeft: 16 },
  form: { flex: 1 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  inputIcon: { marginLeft: 12 },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalText: { fontSize: 16, color: '#1F2937' },
  ingredientsContainer: { marginBottom: 16 },
  ingredientText: { fontSize: 14, color: '#1F2937', marginBottom: 4 },
  budgetText: { fontSize: 14, fontWeight: '600', color: '#16a34a', marginTop: 8 },
  generateButton: {
    backgroundColor: '#a855f7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  generateButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 8,
    width: '80%',
    maxWidth: 300,
  },
  modalItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  modalItemText: {
    fontSize: 16,
    color: '#1F2937',
    textAlign: 'center',
  },
  modalItemSelected: {
    backgroundColor: '#FEE2E2',
  },
  modalItemTextSelected: {
    color: '#f97316',
    fontWeight: '600',
  },
  noRecipesText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    padding: 16,
  },
});

export default AIGenerate;

function alert(_arg0: string) {
  throw new Error('Function not implemented.');
}
