import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { generateText } from '../services/GeminiService';

type Props = NativeStackScreenProps<RootStackParamList, 'IARecipeSuggestions'>;

interface SuggestionItem {
  id: string;
  title: string;
  description: string; // Contient la méthodologie
  ingredients: string[];
  time: string;
  difficulty: string;
}

const IARecipeSuggestionsScreen: React.FC<Props> = ({ navigation }) => {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [desiredFood, setDesiredFood] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Rapide');

  const availableIngredients = React.useMemo(() =>
    ['poulet', 'riz', 'tomate', 'oignon', 'ail', 'carotte'], []
  );

  const categories = ['Rapide', 'Végétarien', 'Économique', 'Traditionnel', 'Personnalisé'];

  const handleGenerateSuggestions = async (category: string, customText?: string) => {
    setIsLoading(true);
    try {
      let prompt = '';

      if (category === 'Personnalisé' && customText) {
        prompt = customText;
      } else if (desiredFood.trim()) {
        prompt = `Fournis une recette ${category.toLowerCase()} pour "${desiredFood}". 
        Inclure : Titre|Ingrédients (liste séparée par des virgules)|Méthodologie (étapes détaillées)|Temps|Difficulté`;
      } else {
        prompt = `Suggérez 3 recettes ${category.toLowerCase()}. 
        Pour chaque recette : Titre|Ingrédients (liste séparée par des virgules)|Méthodologie (étapes détaillées)|Temps|Difficulté`;
      }

      const result = await generateText(prompt);

      const parsedSuggestions: SuggestionItem[] = result.split('\n\n').map((item, index) => {
        const parts = item.split('|').map(part => part.trim());
        return {
          id: `suggestion-${index}`,
          title: parts[0] || `Recette ${index + 1}`,
          ingredients: parts[1] ? parts[1].split(',').map(i => i.trim()) : [],
          description: parts[2] || 'Méthodologie non disponible',
          time: parts[3] || '30 min',
          difficulty: parts[4] || 'Facile',
        };
      }).filter(item => item.title.trim() !== '');

      setSuggestions(parsedSuggestions);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer les suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    if (category !== 'Personnalisé' && !desiredFood.trim()) {
      handleGenerateSuggestions(category);
    }
  };

  const handleCustomGenerate = () => {
    if (customPrompt.trim()) {
      handleGenerateSuggestions('Personnalisé', customPrompt);
    }
  };

  const handleFoodGenerate = () => {
    if (desiredFood.trim()) {
      handleGenerateSuggestions(selectedCategory);
    } else {
      Alert.alert('Attention', 'Veuillez entrer une nourriture à préparer.');
    }
  };

  const renderSuggestionCard = ({ item }: { item: SuggestionItem }) => (
    <View style={styles.suggestionCard}>
      <View style={styles.cardHeader}>
        <View style={styles.aiIcon}>
          <MaterialCommunityIcons name="robot" size={20} color="#a855f7" />
        </View>
        <View style={styles.cardTitle}>
          <Text style={styles.suggestionTitle}>{item.title}</Text>
          <Text style={styles.aiLabel}>✨ Suggéré par IA</Text>
        </View>
      </View>

      <Text style={styles.suggestionDescription}>{item.description}</Text>

      <View style={styles.recipeInfo}>
        <Text style={styles.infoText}>⏱️ {item.time}</Text>
        <Text style={styles.infoText}>📈 {item.difficulty}</Text>
        <Text style={styles.infoText}>🤖 IA</Text>
      </View>

      <View style={styles.ingredientsList}>
        {item.ingredients.slice(0, 3).map((ingredient, idx) => (
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

      <TouchableOpacity
        style={styles.useRecipeButton}
        onPress={() => Alert.alert('Info', 'Fonctionnalité à implémenter')}
      >
        <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.gradientButton}>
          <MaterialCommunityIcons name="chef-hat" size={16} color="#fff" />
          <Text style={styles.buttonText}>Utiliser cette recette</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suggestions IA</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="robot" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Ingrédients disponibles (optionnel, pour info) */}
        <View style={styles.ingredientsSection}>
          <Text style={styles.sectionTitle}>📦 Ingrédients disponibles (optionnel)</Text>
          <View style={styles.availableIngredients}>
            {availableIngredients.map((ingredient, index) => (
              <View key={index} style={styles.availableIngredientTag}>
                <Text style={styles.availableIngredientText}>{ingredient}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Nourriture à préparer */}
        <View style={styles.foodSection}>
          <Text style={styles.sectionTitle}>🍽️ Choisir une nourriture à préparer</Text>
          <View style={styles.foodInputContainer}>
            <TextInput
              style={styles.foodInput}
              placeholder="Ex: Poulet rôti, Pizza..."
              placeholderTextColor="#9CA3AF"
              value={desiredFood}
              onChangeText={setDesiredFood}
              multiline
              numberOfLines={1}
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleFoodGenerate}
              disabled={isLoading || !desiredFood.trim()}
            >
              <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.gradientButton}>
                {isLoading ? (
                  <MaterialCommunityIcons name="loading" size={16} color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="magic-staff" size={16} color="#fff" />
                )}
                <Text style={styles.buttonText}>
                  {isLoading ? 'Génération...' : 'Générer'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Catégories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>🎯 Catégories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.selectedCategoryButton,
                ]}
                onPress={() => handleCategorySelect(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryButtonText,
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prompt personnalisé */}
        {selectedCategory === 'Personnalisé' && (
          <View style={styles.customPromptSection}>
            <Text style={styles.sectionTitle}>✍️ Demande personnalisée</Text>
            <View style={styles.customPromptContainer}>
              <TextInput
                style={styles.customPromptInput}
                placeholder="Ex: Recette de pizza avec mes ingrédients, ou une soupe créative..."
                placeholderTextColor="#9CA3AF"
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                numberOfLines={3}
              />
              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleCustomGenerate}
                disabled={isLoading || !customPrompt.trim()}
              >
                <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.gradientButton}>
                  {isLoading ? (
                    <MaterialCommunityIcons name="loading" size={16} color="#fff" />
                  ) : (
                    <MaterialCommunityIcons name="magic-staff" size={16} color="#fff" />
                  )}
                  <Text style={styles.buttonText}>
                    {isLoading ? 'Génération...' : 'Générer'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.sectionTitle}>🤖 Suggestions IA</Text>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="robot" size={48} color="#a855f7" />
              <Text style={styles.loadingText}>L'IA génère vos recettes...</Text>
            </View>
          ) : (
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={renderSuggestionCard}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons name="chef-hat" size={48} color="#9CA3AF" />
                  <Text style={styles.emptyText}>
                    Entrez une nourriture ou sélectionnez une catégorie pour des suggestions
                  </Text>
                </View>
              }
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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

  // Sections
  ingredientsSection: { marginBottom: 24 },
  foodSection: { marginBottom: 24 },
  categoriesSection: { marginBottom: 24 },
  customPromptSection: { marginBottom: 24 },
  suggestionsSection: { marginBottom: 24 },

  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 12 },

  // Ingrédients disponibles
  availableIngredients: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  availableIngredientTag: {
    backgroundColor: '#dcfce7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  availableIngredientText: { fontSize: 12, color: '#16a34a', fontWeight: '500' },

  // Nourriture à préparer
  foodInputContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginRight: 12,
  },

  // Catégories
  categoriesScroll: { flexDirection: 'row' },
  categoryButton: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
  },
  selectedCategoryButton: {
    backgroundColor: '#a855f7',
  },
  categoryButtonText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  selectedCategoryButtonText: { color: '#fff' },

  // Prompt personnalisé
  customPromptContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 16, elevation: 2 },
  customPromptInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  generateButton: { alignSelf: 'flex-end' },

  // Suggestions
  suggestionCard: {
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
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  aiIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f3e8ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: { flex: 1 },
  suggestionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  aiLabel: { fontSize: 12, color: '#a855f7', marginTop: 2 },
  suggestionDescription: { fontSize: 14, color: '#6B7280', marginBottom: 12, lineHeight: 20 },

  // Infos recette (réutilisées)
  recipeInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  infoText: { fontSize: 12, color: '#6B7280' },
  ingredientsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 16 },
  ingredientTag: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  ingredientText: { fontSize: 12, color: '#6B7280' },

  // Boutons
  useRecipeButton: { alignSelf: 'flex-start' },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  buttonText: { fontSize: 14, fontWeight: '600', color: '#fff', marginLeft: 6 },

  // États vides et loading
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  loadingText: { fontSize: 16, color: '#6B7280', marginTop: 12, textAlign: 'center' },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
  },
  emptyText: { fontSize: 16, color: '#6B7280', marginTop: 12, textAlign: 'center' },
});

export default IARecipeSuggestionsScreen;
