import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { db } from '../services/firebase';
import { doc, setDoc, collection } from '@react-native-firebase/firestore';
// Assurez-vous que 'react-native-image-picker' est installé: npm install react-native-image-picker
// Ou yarn add react-native-image-picker, puis lien si RN < 0.60
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';


type Props = NativeStackScreenProps<RootStackParamList, 'AddRecipe'>;

// Nouvelle interface pour un ingrédient
interface Ingredient {
  name: string;
  quantity: string; // Gardé comme string pour la flexibilité de l'input utilisateur (e.g., "1.5", "200")
  unit: string;    // Unité (e.g., "g", "ml", "cuillère à café", "pièces")
}

// Nouvelle interface pour une étape
interface Step {
  title: string;
  instruction: string;
  time?: string; // Optionnel
  image?: string; // Optionnel
}

const AddRecipeScreen: React.FC<Props> = ({ navigation, route }) => {
  const isEditing = route.params?.recipe ? true : false;

  const [recipeName, setRecipeName] = useState(route.params?.recipe?.name || '');
  const [time, setTime] = useState(
    route.params?.recipe?.time?.replace(' min', '') || ''
  ); // Convertir "30 min" en "30"
  const [difficulty, setDifficulty] = useState(route.params?.recipe?.difficulty || 'Facile');
  const [servings, setServings] = useState(route.params?.recipe?.servings?.toString() || '4'); // Nouvelle propriété pour les portions

  // Initialisation des ingrédients: Si une recette est passée, la déconstruire
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    if (route.params?.recipe?.ingredients && Array.isArray(route.params.recipe.ingredients)) {
      // Si les ingrédients sont déjà des objets structurés (nouvelle méthode de sauvegarde)
      if (route.params.recipe.ingredients.length > 0 && typeof route.params.recipe.ingredients[0] === 'object') {
        return route.params.recipe.ingredients.map((ing: any) => ({
          name: ing.name || '',
          quantity: ing.quantity?.toString() || '',
          unit: ing.unit || '',
        }));
      } else {
        // Sinon, si ce sont les anciennes chaînes "Nom (Quantité)", essayez de parser
        return route.params.recipe.ingredients.map((ingString: string) => {
          const match = ingString.match(/^(.*)\s\(([\d.,]+)\s?([a-zA-ZÀ-ÿ\s]*)\)$/);
          if (match) {
            return {
              name: match[1].trim(),
              quantity: match[2].replace(',', '.'), // Remplace la virgule par un point pour parseFloat
              unit: match[3].trim(),
            };
          }
          // Fallback si le format ne correspond pas
          return { name: ingString.split('(')[0].trim() || '', quantity: '', unit: '' };
        });
      }
    }
    return [{ name: '', quantity: '', unit: '' }];
  });

  // Initialisation des instructions comme tableau d'étapes
  const [recipeInstructions, setRecipeInstructions] = useState<string[]>(() => {
    if (route.params?.recipe?.steps && Array.isArray(route.params.recipe.steps)) {
      // Si les étapes sont déjà des objets structurés
      if (route.params.recipe.steps.length > 0 && typeof route.params.recipe.steps[0] === 'object') {
        return route.params.recipe.steps.map((step: any) => step.instruction || '');
      }
    }
    return ['']; // Par défaut une seule ligne vide
  });


  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(route.params?.recipe?.image || null);
  const [isLoading, setIsLoading] = useState(false);

  const difficultyOptions = ['Très facile', 'Facile', 'Moyen', 'Difficile'];

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '', unit: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length === 1) {
      Alert.alert('Erreur', 'Une recette doit avoir au moins un ingrédient.');
      return;
    }
    const newIngredients = ingredients.filter((_, idx) => idx !== index);
    setIngredients(newIngredients);
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addInstructionStep = () => {
    setRecipeInstructions([...recipeInstructions, '']);
  };

  const removeInstructionStep = (index: number) => {
    if (recipeInstructions.length === 1) {
      Alert.alert('Erreur', 'Une recette doit avoir au moins une étape.');
      return;
    }
    const newSteps = recipeInstructions.filter((_, idx) => idx !== index);
    setRecipeInstructions(newSteps);
  };

  const updateInstructionStep = (index: number, value: string) => {
    const newSteps = [...recipeInstructions];
    newSteps[index] = value;
    setRecipeInstructions(newSteps);
  };

  const openCamera = () => {
    const options = { mediaType: 'photo' as const, includeBase64: false };
    launchCamera(options, (response) => {
      if (response.didCancel) {
        Alert.alert('Annulé', 'Vous avez annulé la prise de photo.');
      } else if (response.errorCode) {
        Alert.alert('Erreur', `Erreur : ${response.errorMessage}`);
      } else if (response.assets && response.assets[0].uri) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const openGallery = () => {
    const options = { mediaType: 'mixed' as const, includeBase64: false };
    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        Alert.alert('Annulé', 'Vous avez annulé la sélection.');
      } else if (response.errorCode) {
        Alert.alert('Erreur', `Erreur : ${response.errorMessage}`);
      } else if (response.assets && response.assets[0].uri) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  // Nutrition data (simplified for this example) - you would expand this
  const nutritionDataMap: { [key: string]: { caloriesPer100g: number; pricePer100g: number; proteinsPer100g?: number; carbsPer100g?: number; fatsPer100g?: number; } } = {
    spaghettis: { caloriesPer100g: 131, pricePer100g: 0.5, proteinsPer100g: 5, carbsPer100g: 25, fatsPer100g: 1 },
    lardons: { caloriesPer100g: 300, pricePer100g: 2.5, proteinsPer100g: 20, carbsPer100g: 0, fatsPer100g: 25 },
    'oeufs': { caloriesPer100g: 155, pricePer100g: 0.3, proteinsPer100g: 13, carbsPer100g: 1, fatsPer100g: 11 },
    'parmesan': { caloriesPer100g: 431, pricePer100g: 1.8, proteinsPer100g: 35, carbsPer100g: 3, fatsPer100g: 29 },
    // Ajoutez plus d'ingrédients ici
  };

  const calculateNutrition = () => {
    let totalCalories = 0;
    let totalBudget = 0;
    let totalProteins = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    ingredients.forEach((ing) => {
      const name = ing.name.toLowerCase();
      // Assurez-vous que la quantité est un nombre, même si elle vient d'un input string
      const qty = parseFloat(ing.quantity.replace(',', '.')) || 0;

      const data = nutritionDataMap[name];
      if (data) {
        // Pour les calculs, nous devons normaliser la quantité à une base commune (e.g., 100g/ml)
        // Ceci est une simplification. Une vraie app gérerait les unités (tsp, cup, etc.)
        // Pour l'exemple, nous supposons que 'qty' correspond à une quantité directement utilisable pour 'per100g'.
        // Si 'unit' est 'pièces', la logique serait différente.
        totalCalories += (data.caloriesPer100g * qty) / 100; // Si qty est en grammes
        totalBudget += (data.pricePer100g * qty) / 100;
        totalProteins += (data.proteinsPer100g || 0) * qty / 100;
        totalCarbs += (data.carbsPer100g || 0) * qty / 100;
        totalFats += (data.fatsPer100g || 0) * qty / 100;
      }
    });

    const numServings = parseInt(servings, 10) || 1; // Obtenir le nombre de portions
    return {
      calories: Math.round(totalCalories / numServings),
      budget: parseFloat((totalBudget / numServings).toFixed(2)),
      proteins: Math.round(totalProteins / numServings),
      carbs: Math.round(totalCarbs / numServings),
      fats: Math.round(totalFats / numServings),
    };
  };


  const saveRecipe = async () => {
    // Validation des champs
    if (!recipeName.trim()) {
      Alert.alert('Erreur', 'Le nom de la recette est requis.');
      return;
    }
    if (!time.trim() || isNaN(parseInt(time, 10))) {
      Alert.alert('Erreur', 'Veuillez entrer un temps de préparation valide (en minutes).');
      return;
    }
    if (ingredients.some((ing) => !ing.name.trim() || !ing.quantity.trim() || !ing.unit.trim())) {
      Alert.alert('Erreur', 'Tous les ingrédients doivent avoir un nom, une quantité et une unité.');
      return;
    }
    if (recipeInstructions.some(inst => !inst.trim())) {
      Alert.alert('Erreur', 'Toutes les étapes d\'instruction doivent être remplies.');
      return;
    }
    const numServings = parseInt(servings, 10);
    if (isNaN(numServings) || numServings <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un nombre de portions valide.');
      return;
    }


    setIsLoading(true);
    console.log('1. saveRecipe: Début de la fonction, isLoading activé.');

    const { calories, budget, proteins, carbs, fats } = calculateNutrition();

    // Préparer les ingrédients pour Firestore (quantité convertie en nombre)
    const ingredientsForFirestore = ingredients.map(ing => ({
      name: ing.name,
      quantity: parseFloat(ing.quantity.replace(',', '.')) || 0, // Convertir en nombre
      unit: ing.unit,
      available: true, // Par défaut, marquer comme disponible lors de la création
    }));

    // Préparer les étapes pour Firestore
    const stepsForFirestore: Step[] = recipeInstructions.map((instruction, index) => ({
      title: `Étape ${index + 1}`, // Titre généré automatiquement
      instruction: instruction,
      time: '0 min', // Temps par défaut, pourrait être une saisie utilisateur future
      image: '', // Image par défaut, pourrait être une saisie utilisateur future
    }));

    try {
      // Si c'est une édition, on utilise l'ID existant, sinon on en génère un nouveau
      const recipeId = route.params?.recipe?.id || doc(collection(db, 'recipes')).id;
      console.log('2. saveRecipe: Tente de sauvegarder la recette avec l\'ID :', recipeId);

      // --- MODIFICATION CLÉ : Retrait de 'await' pour un comportement "fire-and-forget" ---
      setDoc(doc(db, 'recipes', recipeId), {
        id: recipeId,
        name: recipeName,
        time: `${time} min`,
        difficulty,
        image: imageUri || '', // Stocker une chaîne vide au lieu d'une emoji si pas d'image
        servings: numServings, // Enregistrer le nombre de portions
        ingredients: ingredientsForFirestore, // Le tableau d'objets structurés
        steps: stepsForFirestore, // Le tableau d'objets étapes
        nutrition: { // Objet nutrition imbriqué
          calories: calories,
          proteins: proteins,
          carbs: carbs,
          fats: fats,
        },
        budget: budget, // Budget reste à la racine pour l'instant
        isPersonal: true,
        availableIngredients: ingredientsForFirestore.filter(ing => ing.available).length, // Compter les ingrédients "disponibles" (ici, tous)
        creator: 'Kev', // ID de l'utilisateur ou nom
        rating: 0, // Valeur par défaut
        reviews: 0, // Valeur par défaut
        description: '', // Ajouter une description si nécessaire
        tips: [], // Ajouter des conseils si nécessaire
      }).then(() => {
        // Ce bloc se déclenche quand Firebase confirme la sauvegarde (en arrière-plan)
        console.log('3. saveRecipe: setDoc terminé avec succès (promesse résolue).');
      }).catch((error) => {
        // Ce bloc se déclenche si Firebase rejette l'opération
        console.error('ERREUR Firebase asynchrone lors de l\'enregistrement de la recette :', error);
        Alert.alert('Erreur Firebase', error.message || 'Échec de l\'ajout de la recette en arrière-plan. Vérifiez vos permissions.');
      });
      // --- FIN DE LA MODIFICATION CLÉ ---

      // Ces lignes s'exécuteront immédiatement après le lancement de setDoc, sans attendre sa résolution
      navigation.goBack();
      console.log('4. saveRecipe: Navigation vers l\'écran précédent initiée (goBack).');

      Alert.alert(
        isEditing ? '✅ Recette modifiée !' : '✅ Recette ajoutée !',
        isEditing ? 'Votre recette a été mise à jour avec succès.' : 'Votre nouvelle recette a été enregistrée avec succès.'
      );
      console.log('5. saveRecipe: Alerte de succès affichée.');

    } catch (error: any) {
      // Ce bloc catch ne capturera que les erreurs synchrone avant l'appel à setDoc
      console.error('ERREUR SYNCHRONE lors de l\'enregistrement de la recette :', error);
      Alert.alert('Erreur', error.message || 'Échec de l\'ajout de la recette (erreur synchrone).');
    } finally {
      // Ce bloc est TOUJOURS exécuté après le try ou le catch synchrone
      setTimeout(() => {
        setIsLoading(false);
        console.log('6. saveRecipe: Fonction terminée, isLoading désactivé (via setTimeout).');
      }, 500); // Délai de 500 ms pour l'UI
    }
  };


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Modifier la Recette' : 'Créer une Recette'}</Text>
            <View style={styles.headerIcons}>
              <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
              <View style={styles.profileIcon}>
                <MaterialCommunityIcons name="account" size={20} color="#fff" />
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.photoContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              <MaterialCommunityIcons name="camera" size={48} color="#9CA3AF" />
            )}
            <Text style={styles.photoText}>{imageUri ? 'Photo sélectionnée' : 'Ajouter une photo'}</Text>
            <View style={styles.photoButtonContainer}>
              <TouchableOpacity style={styles.photoButton} onPress={openCamera}>
                <Text style={styles.photoButtonText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.photoButton} onPress={openGallery}>
                <Text style={styles.photoButtonText}>Choisir dans la galerie</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informations de base</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nom de la recette</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Gratin de Grand-mère"
                placeholderTextColor="#9CA3AF"
                value={recipeName}
                onChangeText={setRecipeName}
              />
            </View>
            <View style={styles.row}>
              <View style={[styles.inputContainer, styles.quarterWidth]}>
                <Text style={styles.label}>Temps(min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  value={time}
                  onChangeText={setTime}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, styles.quarterWidth]}>
                <Text style={styles.label}>Portions</Text>
                <TextInput
                  style={styles.input}
                  placeholder="4"
                  placeholderTextColor="#9CA3AF"
                  value={servings}
                  onChangeText={setServings}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Difficulté</Text>
                <View style={styles.dropdownContainer}>
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowDifficultyDropdown(!showDifficultyDropdown)}
                  >
                    <Text style={styles.dropdownText}>{difficulty}</Text>
                    <MaterialCommunityIcons
                      name={showDifficultyDropdown ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                  {showDifficultyDropdown && (
                    <View style={styles.dropdownList}>
                      {difficultyOptions.map((option, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dropdownItem,
                            option === difficulty && styles.selectedItem,
                          ]}
                          onPress={() => {
                            setDifficulty(option);
                            setShowDifficultyDropdown(false);
                          }}
                        >
                          <Text style={[
                            styles.dropdownItemText,
                            option === difficulty && styles.selectedItemText,
                          ]}>
                            {option}
                          </Text>
                          {option === difficulty && (
                            <MaterialCommunityIcons name="check" size={16} color="#f97316" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ingrédients</Text>
              <TouchableOpacity onPress={addIngredient}>
                <Text style={styles.addText}>
                  <MaterialCommunityIcons name="plus" size={16} color="#f97316" /> Ajouter
                </Text>
              </TouchableOpacity>
            </View>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientNameInput]}
                  placeholder="Nom ingrédient"
                  placeholderTextColor="#9CA3AF"
                  value={item.name}
                  onChangeText={(value) => updateIngredient(index, 'name', value)}
                />
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  placeholder="Qté"
                  placeholderTextColor="#9CA3AF"
                  value={item.quantity}
                  onChangeText={(value) => updateIngredient(index, 'quantity', value)}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.input, styles.unitInput]}
                  placeholder="Unité"
                  placeholderTextColor="#9CA3AF"
                  value={item.unit}
                  onChangeText={(value) => updateIngredient(index, 'unit', value)}
                />
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Instructions</Text>
              <TouchableOpacity onPress={addInstructionStep}>
                <Text style={styles.addText}>
                  <MaterialCommunityIcons name="plus" size={16} color="#f97316" /> Ajouter étape
                </Text>
              </TouchableOpacity>
            </View>
            {recipeInstructions.map((instruction, index) => (
              <View key={index} style={styles.instructionRow}>
                <TextInput
                  style={[styles.input, styles.instructionInput]}
                  placeholder={`Étape ${index + 1}...`}
                  placeholderTextColor="#9CA3AF"
                  value={instruction}
                  onChangeText={(value) => updateInstructionStep(index, value)}
                  multiline
                  numberOfLines={2}
                />
                <TouchableOpacity onPress={() => removeInstructionStep(index)}>
                  <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.actionButtonContainer}>
            <TouchableOpacity
              onPress={saveRecipe}
              style={styles.publishButtonWrapper}
              disabled={isLoading}
            >
              <LinearGradient colors={isLoading ? ['#ccc', '#aaa'] : ['#f97316', '#ef4444']} style={styles.publishButton}>
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" style={styles.buttonIcon} />
                    <Text style={styles.publishButtonText}>
                      {isEditing ? 'Modifier la Recette' : 'Publier la Recette'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollContentContainer: { paddingBottom: 32 },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24, // Ajustement pour iOS statusBar
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
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
  content: { padding: 16 },
  photoContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 12,
  },
  photoText: { fontSize: 14, color: '#6B7280', marginTop: 8, marginBottom: 12 },
  photoButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  photoButton: {
    backgroundColor: '#f97316',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  photoButtonText: { fontSize: 14, color: '#fff', fontWeight: '500', textAlign: 'center' },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  addText: { fontSize: 14, color: '#f97316', fontWeight: '500' },
  inputContainer: { marginBottom: 16 },
  halfWidth: { flex: 1 },
  quarterWidth: { flex: 0.5 }, // Nouveau style pour les inputs plus petits
  label: { fontSize: 12, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff', // S'assurer que le fond est blanc pour TextInput
  },
  row: { flexDirection: 'row', gap: 16 },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedItem: {
    backgroundColor: '#FEF3E2',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  selectedItemText: {
    color: '#f97316',
    fontWeight: '500',
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 8, // Réduit le padding pour s'adapter aux 3 inputs
    marginBottom: 12,
  },
  ingredientNameInput: { flex: 2 }, // Plus large
  quantityInput: { flex: 0.8, textAlign: 'right' }, // Plus petit pour la quantité
  unitInput: { flex: 1, textAlign: 'center' }, // Pour l'unité
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  instructionInput: { flex: 1, textAlignVertical: 'top' }, // Assure que le texte commence en haut
  actionButtonContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 80,
  },
  publishButtonWrapper: {
    width: '75%',
    maxWidth: 300,
  },
  publishButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    shadowColor: '#f97316',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonIcon: {
    marginRight: 8,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default AddRecipeScreen;
