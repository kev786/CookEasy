/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Dimensions, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types'; // Assurez-vous que RootStackParamList est bien défini ici

const { width } = Dimensions.get('window');

// Interfaces pour la structure de données attendue
interface Ingredient {
  name: string;
  quantity: number; // Maintenant un nombre
  unit: string;    // Unité séparée
  available: boolean;
}

interface Step {
  title: string;
  instruction: string;
  time?: string;
  image?: string;
}

interface NutritionInfo {
  calories: number;
  proteins: number;
  carbs: number;
  fats: number;
}

interface Recipe {
  id: string;
  name: string;
  time: string; // Ex: "30 min"
  difficulty: string;
  image?: string;
  servings: number; // Maintenant un nombre
  ingredients: Ingredient[]; // Tableau d'objets Ingredient
  steps: Step[];         // Tableau d'objets Step
  nutrition: NutritionInfo; // Objet NutritionInfo
  budget: number;
  isPersonal: boolean;
  availableIngredients: number;
  creator: string;
  rating?: number;
  reviews?: number;
  description?: string; // Peut être vide
  tips?: string[]; // Peut être vide
}

type Props = NativeStackScreenProps<RootStackParamList, 'RecipeDetail'>;

const RecipeDetailPage: React.FC<Props> = ({ route, navigation }) => {
  const [currentTab, setCurrentTab] = useState(0); // Renommé currentStep en currentTab pour plus de clarté
  const [portions, setPortions] = useState(0); // Initialisé à 0 pour être mis à jour par recipe.servings
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Récupérer la recette depuis les paramètres de navigation
  const recipe = route.params?.recipe as Recipe; // Caster en Recipe

  // Mettre à jour les portions par défaut une fois la recette chargée
  React.useEffect(() => {
    if (recipe && recipe.servings) {
      setPortions(recipe.servings);
    }
  }, [recipe]);

  // Vérifier si la recette est disponible
  if (!recipe) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucune recette disponible.</Text>
        <TouchableOpacity style={styles.backButtonEmpty} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
          <Text style={styles.backButtonEmptyText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleStepComplete = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) {
      setCompletedSteps(completedSteps.filter(i => i !== stepIndex));
    } else {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
  };

  const adjustPortions = (change: number) => {
    const newPortions = Math.max(1, portions + change);
    setPortions(newPortions);
  };

  const calculateAdjustedQuantity = (originalQuantity: number) => {
    // S'assurer que originalQuantity est un nombre
    const qtyNum = typeof originalQuantity === 'number' ? originalQuantity : parseFloat(String(originalQuantity).replace(',', '.')) || 0;
    return (qtyNum * portions / recipe.servings).toFixed(1);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  return (
    <View style={styles.container}>
      {/* Header avec image et actions */}
      <View style={styles.headerContainer}>
        {/* Image de fond avec gradient */}
        <LinearGradient
          colors={['#f97316', '#ef4444']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {recipe.image && recipe.image.startsWith('http') ? ( // Vérifier si l'URI est valide
            <Image
              source={{ uri: recipe.image }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.headerEmoji}>🍳</Text>
          )}
        </LinearGradient>

        {/* Bouton retour */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>

        {/* Actions flottantes */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setIsFavorite(!isFavorite)}
            style={[styles.actionButton, isFavorite && styles.favoriteButton]}
          >
            <MaterialCommunityIcons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#fff' : '#374151'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialCommunityIcons name="share-variant" size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Card d'informations overlay */}
        <View style={styles.infoOverlay}>
          <View style={styles.infoCard}>
            <Text style={styles.recipeTitle}>{recipe.name}</Text>

            <View style={styles.quickInfoRow}>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="clock-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{recipe.time}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="chef-hat" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{recipe.difficulty}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialCommunityIcons name="account-group" size={16} color="#6B7280" />
                <Text style={styles.infoText}>{recipe.servings} pers.</Text>
              </View>
            </View>

            <View style={styles.ratingAndBudget}>
              <View style={styles.ratingContainer}>
                <View style={styles.starsRow}>
                  {[...Array(5)].map((_, i) => (
                    <MaterialCommunityIcons
                      key={i}
                      name={i < Math.floor(recipe.rating || 0) ? 'star' : 'star-outline'}
                      size={16}
                      color="#facc15"
                    />
                  ))}
                </View>
                <Text style={styles.ratingText}>{recipe.rating || 0}</Text>
                <Text style={styles.reviewsText}>({recipe.reviews || 0} avis)</Text>
              </View>
              <View style={styles.budgetContainer}>
                <Text style={styles.budgetText}>{recipe.budget || 0}FCFA</Text>
                <Text style={styles.caloriesText}>{recipe.nutrition?.calories || 0} cal</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Navigation par onglets - sticky */}
      <View style={styles.tabContainer}>
        {['Ingrédients', 'Étapes', 'Conseils'].map((tab, idx) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton]}
            onPress={() => setCurrentTab(idx)}
          >
            <Text
              style={[
                styles.tabText,
                currentTab === idx && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
            {currentTab === idx && <View style={styles.activeTabIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Contenu des onglets */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {currentTab === 0 && (
            <View style={styles.tabContent}>
              {/* Ajusteur de portions */}
              <View style={styles.portionSection}>
                <View style={styles.portionHeader}>
                  <Text style={styles.sectionTitle}>Portions</Text>
                  <View style={styles.portionControls}>
                    <TouchableOpacity
                      style={styles.portionButton}
                      onPress={() => adjustPortions(-1)}
                    >
                      <MaterialCommunityIcons name="minus" size={16} color="#374151" />
                    </TouchableOpacity>
                    <Text style={styles.portionNumber}>{portions}</Text>
                    <TouchableOpacity
                      style={styles.portionButton}
                      onPress={() => adjustPortions(1)}
                    >
                      <MaterialCommunityIcons name="plus" size={16} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Liste des ingrédients */}
              <View style={styles.section}>
                <View style={styles.ingredientsHeader}>
                  <Text style={styles.sectionTitle}>Ingrédients</Text>
                  <TouchableOpacity style={styles.shoppingButton}>
                    <MaterialCommunityIcons name="cart-outline" size={16} color="#fff" />
                    <Text style={styles.shoppingButtonText}>Ajouter aux courses</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.ingredientsList}>
                  {recipe.ingredients && recipe.ingredients.length > 0 ? (
                    recipe.ingredients.map((ingredient: Ingredient, idx: number) => (
                      <View
                        key={idx}
                        style={[
                          styles.ingredientItem,
                          ingredient.available ? styles.availableIngredient : styles.unavailableIngredient,
                        ]}
                      >
                        <View
                          style={[
                            styles.availabilityDot,
                            { backgroundColor: ingredient.available ? '#10b981' : '#ef4444' },
                          ]}
                        />
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <View style={styles.quantityContainer}>
                          <Text style={styles.quantityMain}>
                            {calculateAdjustedQuantity(ingredient.quantity)} {ingredient.unit}
                          </Text>
                          {portions !== recipe.servings && (
                            <Text style={styles.quantityOriginal}>
                              ({ingredient.quantity} {ingredient.unit} pour {recipe.servings})
                            </Text>
                          )}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>Aucun ingrédient renseigné pour cette recette.</Text>
                  )}
                </View>
              </View>

              {/* Informations nutritionnelles */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Valeurs nutritionnelles (par portion)</Text>
                <View style={styles.nutritionGrid}>
                  <View style={[styles.nutritionCard, styles.caloriesCard]}>
                    <Text style={[styles.nutritionValue, styles.caloriesValue]}>
                      {recipe.nutrition?.calories || 0}
                    </Text>
                    <Text style={styles.nutritionLabel}>Calories</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.proteinsCard]}>
                    <Text style={[styles.nutritionValue, styles.proteinsValue]}>
                      {recipe.nutrition?.proteins || 0}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Protéines</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.carbsCard]}>
                    <Text style={[styles.nutritionValue, styles.carbsValue]}>
                      {recipe.nutrition?.carbs || 0}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Glucides</Text>
                  </View>
                  <View style={[styles.nutritionCard, styles.fatsCard]}>
                    <Text style={[styles.nutritionValue, styles.fatsValue]}>
                      {recipe.nutrition?.fats || 0}g
                    </Text>
                    <Text style={styles.nutritionLabel}>Lipides</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {currentTab === 1 && (
            <View style={styles.tabContent}>
              {/* Mode cuisine */}
              <LinearGradient colors={['#f97316', '#ef4444']} style={styles.cookingModeCard}>
                <View style={styles.cookingModeContent}>
                  <View style={styles.cookingModeInfo}>
                    <Text style={styles.cookingModeTitle}>Mode Cuisine</Text>
                    <Text style={styles.cookingModeSubtitle}>Suivez étape par étape</Text>
                  </View>
                  <TouchableOpacity style={styles.cookingModeButton}>
                    <Text style={styles.cookingModeButtonText}>Commencer</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>

              {/* Étapes de la recette */}
              {recipe.steps && recipe.steps.length > 0 ? (
                recipe.steps.map((step: Step, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.stepCard,
                      completedSteps.includes(idx) ? styles.completedStepCard : styles.activeStepCard,
                    ]}
                  >
                    <View style={styles.stepContent}>
                      <View
                        style={[
                          styles.stepNumberContainer,
                          completedSteps.includes(idx) ? styles.completedStepNumber : styles.activeStepNumber,
                        ]}
                      >
                        {completedSteps.includes(idx) ? (
                          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                        ) : (
                          <Text style={styles.stepNumber}>{idx + 1}</Text>
                        )}
                      </View>

                      <View style={styles.stepInfo}>
                        <View style={styles.stepHeader}>
                          <Text style={styles.stepTitle}>{step.title || `Étape ${idx + 1}`}</Text>
                          {step.time && (
                            <View style={styles.stepTimeContainer}>
                              <MaterialCommunityIcons name="timer-outline" size={16} color="#6B7280" />
                              <Text style={styles.stepTime}>{step.time}</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.stepInstruction}>{step.instruction}</Text>

                        <View style={styles.stepFooter}>
                          {step.image && step.image.startsWith('http') ? (
                            <Image
                              source={{ uri: step.image }}
                              style={styles.stepImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={styles.stepEmoji}>📝</Text>
                          )}
                          <View style={styles.stepActions}>
                            <TouchableOpacity style={styles.timerButton} onPress={toggleTimer}>
                              <MaterialCommunityIcons
                                name={isTimerRunning ? 'pause' : 'timer-outline'}
                                size={16}
                                color="#6B7280"
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[
                                styles.markCompleteButton,
                                completedSteps.includes(idx) && styles.completedButton,
                              ]}
                              onPress={() => toggleStepComplete(idx)}
                            >
                              <Text
                                style={[
                                  styles.markCompleteText,
                                  completedSteps.includes(idx) && styles.completedText,
                                ]}
                              >
                                {completedSteps.includes(idx) ? 'Terminé' : 'Marquer terminé'}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>Aucune instruction disponible pour cette recette.</Text>
              )}
            </View>
          )}

          {currentTab === 2 && (
            <View style={styles.tabContent}>
              {/* Conseils du chef */}
              <View style={styles.section}>
                <View style={styles.tipsHeader}>
                  <MaterialCommunityIcons name="chef-hat" size={20} color="#f97316" />
                  <Text style={styles.sectionTitle}>Conseils du Chef</Text>
                </View>
                <View style={styles.tipsList}>
                  {recipe.tips && recipe.tips.length > 0 ? (
                    recipe.tips.map((tip: string, idx: number) => (
                      <View key={idx} style={styles.tipItem}>
                        <View style={styles.tipBullet} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>Aucun conseil disponible pour cette recette.</Text>
                  )}
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>À propos de cette recette</Text>
                {recipe.description && recipe.description.trim() !== '' ? (
                  <Text style={styles.descriptionText}>{recipe.description}</Text>
                ) : (
                  <Text style={styles.noDataText}>Aucune description disponible pour cette recette.</Text>
                )}
              </View>

              {/* Avis */}
              <View style={styles.section}>
                <View style={styles.reviewsHeader}>
                  <Text style={styles.sectionTitle}>Avis</Text>
                  <TouchableOpacity>
                    <Text style={styles.viewAllLink}>Voir tous</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.reviewsList}>
                  {/* Données d'avis statiques pour l'exemple, à remplacer par des données dynamiques */}
                  {[
                    { name: 'Sophie M.', rating: 5, comment: 'Délicieux ! Exactement comme en Italie', time: 'Il y a 2 jours' },
                    { name: 'Marc L.', rating: 4, comment: 'Très bon, mes enfants ont adoré', time: 'Il y a 1 semaine' },
                  ].map((review, idx) => (
                    <View key={idx} style={styles.reviewItem}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewerInfo}>
                          <View style={styles.reviewerAvatar}>
                            <Text style={styles.avatarLetter}>{review.name.charAt(0)}</Text>
                          </View>
                          <Text style={styles.reviewerName}>{review.name}</Text>
                        </View>
                        <View style={styles.reviewStars}>
                          {[...Array(5)].map((_, i) => (
                            <MaterialCommunityIcons
                              key={i}
                              name={i < review.rating ? 'star' : 'star-outline'}
                              size={12}
                              color="#facc15"
                            />
                          ))}
                        </View>
                      </View>
                      <Text style={styles.reviewComment}>{review.comment}</Text>
                      <Text style={styles.reviewTime}>{review.time}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.addReviewButton}>
                  <Text style={styles.addReviewText}>Laisser un avis</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Actions flottantes du bas */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.startCookingButton} onPress={toggleTimer}>
          <MaterialCommunityIcons
            name={isTimerRunning ? 'pause' : 'play'}
            size={20}
            color="#fff"
          />
          <Text style={styles.startCookingText}>Commencer à cuisiner</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cartIconButton}>
          <MaterialCommunityIcons name="cart-outline" size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  headerContainer: {
    position: 'relative',
    height: 320,
  },
  headerGradient: {
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImage: {
    width: '100%',
    height: 320,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  headerEmoji: {
    fontSize: 96,
    textAlign: 'center',
    marginTop: 100,
    color: '#fff', // Pour que l'emoji soit visible sur le gradient
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  backButtonEmpty: {
    marginTop: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
  },
  backButtonEmptyText: {
    color: '#374151',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
  },
  headerActions: {
    position: 'absolute',
    top: 40,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  favoriteButton: {
    backgroundColor: '#ef4444',
  },
  infoOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  recipeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickInfoRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  ratingAndBudget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  reviewsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  budgetContainer: {
    alignItems: 'flex-end',
  },
  budgetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  caloriesText: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Navigation tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#f97316',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '80%',
    backgroundColor: '#f97316',
  },

  // Content
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 100,
  },
  tabContent: {
    gap: 24,
  },

  // Sections générales
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Portions
  portionSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  portionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  portionButton: {
    width: 32,
    height: 32,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  portionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f97316',
    minWidth: 32,
    textAlign: 'center',
  },

  // Ingrédients
  ingredientsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  shoppingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  shoppingButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  ingredientsList: {
    gap: 12,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  availableIngredient: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  unavailableIngredient: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  availabilityDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  ingredientName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  quantityContainer: {
    alignItems: 'flex-end',
  },
  quantityMain: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  quantityOriginal: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Nutrition
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  nutritionCard: {
    flex: 1,
    minWidth: (width - 64) / 2 - 8,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  caloriesCard: { backgroundColor: '#ffedd5' },
  proteinsCard: { backgroundColor: '#dbeafe' },
  carbsCard: { backgroundColor: '#d1fae5' },
  fatsCard: { backgroundColor: '#f3e8ff' },
  nutritionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  caloriesValue: { color: '#f97316' },
  proteinsValue: { color: '#3b82f6' },
  carbsValue: { color: '#10b981' },
  fatsValue: { color: '#a855f7' },
  nutritionLabel: {
    fontSize: 14,
    color: '#6B7280',
  },

  // Mode cuisine
  cookingModeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
  },
  cookingModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cookingModeInfo: {},
  cookingModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cookingModeSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  cookingModeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  cookingModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },

  // Étapes
  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeStepCard: {
    borderLeftColor: '#f97316',
  },
  completedStepCard: {
    borderLeftColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  stepContent: {
    flexDirection: 'row',
    gap: 16,
  },
  stepNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeStepNumber: {
    backgroundColor: '#ffedd5',
  },
  completedStepNumber: {
    backgroundColor: '#10b981',
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f97316',
  },
  stepInfo: {
    flex: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  stepTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  stepInstruction: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  stepFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  stepEmoji: {
    fontSize: 24,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#F3F4F6',
  },
  markCompleteButton: {
    backgroundColor: '#ffedd5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  completedButton: {
    backgroundColor: '#d1fae5',
  },
  markCompleteText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
  },
  completedText: {
    color: '#10b981',
  },

  // Conseils
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#fefce8',
    borderRadius: 12,
  },
  tipBullet: {
    width: 8,
    height: 8,
    backgroundColor: '#facc15',
    borderRadius: 4,
    marginTop: 6,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },

  // Description
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 24,
    marginTop: 8,
  },

  // Avis
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reviewsList: {
    gap: 16,
  },
  reviewItem: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reviewerAvatar: {
    width: 32,
    height: 32,
    backgroundColor: '#ffedd5',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  reviewStars: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewComment: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  viewAllLink: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
  },
  addReviewButton: {
    marginTop: 16,
    backgroundColor: '#ffedd5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addReviewText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f97316',
  },

  // Actions flottantes
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  startCookingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f97316',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  startCookingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cartIconButton: {
    width: 56,
    height: 56,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: { // Nouveau style pour les messages "aucune donnée"
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 10,
  },
});

export default RecipeDetailPage;
