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
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';

// Le type des props pour cet écran, spécifiant qu'il attend un objet 'recipe'
type Props = NativeStackScreenProps<RootStackParamList, 'EditRecipe'>;

interface Ingredient {
  name: string;
  quantity: string;
}

const EditRecipeScreen: React.FC<Props> = ({ navigation, route }) => {
  // L'objet 'recipe' est obligatoire et passé via route.params
  const initialRecipe = route.params.recipe; 

  const [recipeName, setRecipeName] = useState(initialRecipe.name || '');
  
  // Correction ici : Vérifiez si 'time' existe avant d'appeler .replace()
  const [time, setTime] = useState(initialRecipe.time?.replace(' min', '') || ''); 
  
  const [difficulty, setDifficulty] = useState(initialRecipe.difficulty || 'Facile');
  
  // Correction ici : Utilisez le chaînage optionnel et fournissez une valeur par défaut sûre
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    initialRecipe.ingredients?.map((ing: string) => { 
      const [name, quantity] = ing.split(' (');
      return { name: name, quantity: quantity.replace(')', '') };
    }) || [{ name: '', quantity: '' }] 
  );
  
  // Correction ici : Utilisez le chaînage optionnel et fournissez une valeur par défaut sûre
  const [instructions, setInstructions] = useState(
    initialRecipe.steps?.map((s: any) => s.instruction).join('\n') || '' 
  );
  
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(initialRecipe.image || null);
  const [isLoading, setIsLoading] = useState(false);

  const difficultyOptions = ['Très facile', 'Facile', 'Moyen', 'Difficile'];

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', quantity: '' }]);
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

  const calculateNutrition = () => {
    let calories = 0;
    let budget = 0;

    ingredients.forEach((ing) => {
      const name = ing.name.toLowerCase();
      const qty = parseFloat(ing.quantity.replace(',', '.')) || 0;

      const nutritionData = {
        spaghettis: { caloriesPer100g: 131, pricePer100g: 0.5 },
        lardons: { caloriesPer100g: 300, pricePer100g: 2.5 },
        'œufs entiers': { caloriesPer100g: 155, pricePer100g: 0.3 },
        'jaunes d\'œufs': { caloriesPer100g: 322, pricePer100g: 0.6 },
        'parmesan râpé': { caloriesPer100g: 431, pricePer100g: 1.8 },
        'poivre noir': { caloriesPer100g: 251, pricePer100g: 5.0 },
        sel: { caloriesPer100g: 0, pricePer100g: 0.1 },
      };

      const data = nutritionData[name as keyof typeof nutritionData];
      if (data) {
        calories += (data.caloriesPer100g * qty) / 100;
        budget += (data.pricePer100g * qty) / 100;
      }
    });

    return { calories: Math.round(calories), budget: parseFloat(budget.toFixed(2)) };
  };

  const saveRecipe = async () => {
    if (!recipeName.trim()) {
      Alert.alert('Erreur', 'Le nom de la recette est requis.');
      return;
    }
    if (!time.trim() || isNaN(parseInt(time, 10))) {
      Alert.alert('Erreur', 'Veuillez entrer un temps de préparation valide (en minutes).');
      return;
    }
    if (ingredients.some((ing) => !ing.name.trim() || !ing.quantity.trim())) {
      Alert.alert('Erreur', 'Tous les ingrédients doivent avoir un nom et une quantité.');
      return;
    }

    setIsLoading(true); 
    console.log('1. saveRecipe: Début de la fonction, isLoading activé.'); 

    const { calories, budget } = calculateNutrition();

    try {
      const recipeId = initialRecipe.id; 
      console.log('2. saveRecipe: Tente de mettre à jour la recette avec l\'ID :', recipeId); 
      
      setDoc(doc(db, 'recipes', recipeId), {
        id: recipeId, 
        name: recipeName,
        time: `${time} min`,
        difficulty,
        image: imageUri || '🍳',
        calories,
        budget,
        ingredients: ingredients.map((ing) => `${ing.name} (${ing.quantity})`),
        isPersonal: initialRecipe.isPersonal, 
        creator: initialRecipe.creator || 'Kev', 
        availableIngredients: 0, 
      }, { merge: true }).then(() => { 
        console.log('3. saveRecipe: setDoc terminé avec succès (promesse résolue).'); 
      }).catch((error) => {
        console.error('ERREUR Firebase asynchrone lors de l\'enregistrement de la recette :', error); 
        Alert.alert('Erreur Firebase', error.message || 'Échec de la modification de la recette en arrière-plan. Vérifiez vos permissions.');
      });
      
      navigation.goBack(); 
      console.log('4. saveRecipe: Navigation vers l\'écran précédent initiée (goBack).'); 

      Alert.alert(
        '✅ Succès',
        'Recette modifiée avec succès !'
      );
      console.log('5. saveRecipe: Alerte de succès affichée.'); 

    } catch (error: any) {
      console.error('ERREUR SYNCHRONE lors de l\'enregistrement de la recette :', error); 
      Alert.alert('Erreur', error.message || 'Échec de la modification de la recette (erreur synchrone).');
    } finally {
      setTimeout(() => {
        setIsLoading(false); 
        console.log('6. saveRecipe: Fonction terminée, isLoading désactivé (via setTimeout).'); 
      }, 500); 
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scrollContentContainer}>
        <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              {/* Correction 1: Envelopper MaterialCommunityIcons dans Text si nécessaire */}
              <Text> 
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              </Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Modifier la Recette</Text> 
            <View style={styles.headerIcons}>
              {/* Correction 2: Envelopper MaterialCommunityIcons dans Text */}
              <Text style={styles.icon}>
                <MaterialCommunityIcons name="bell" size={24} color="#fff" />
              </Text>
              <View style={styles.profileIcon}>
                {/* Correction 3: Envelopper MaterialCommunityIcons dans Text */}
                <Text>
                  <MaterialCommunityIcons name="account" size={20} color="#fff" />
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.photoContainer}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : (
              // Correction 4: Envelopper MaterialCommunityIcons dans Text
              <Text>
                <MaterialCommunityIcons name="camera" size={48} color="#9CA3AF" />
              </Text>
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
              <View style={[styles.inputContainer, styles.halfWidth]}>
                <Text style={styles.label}>Temps (min)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="30"
                  placeholderTextColor="#9CA3AF"
                  value={time}
                  onChangeText={setTime}
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
                    {/* Correction 5: Envelopper MaterialCommunityIcons dans Text */}
                    <Text>
                      <MaterialCommunityIcons
                        name={showDifficultyDropdown ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </Text>
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
                            // Correction 6: Envelopper MaterialCommunityIcons dans Text
                            <Text>
                              <MaterialCommunityIcons name="check" size={16} color="#f97316" />
                            </Text>
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
                  {/* Correction 7: Envelopper MaterialCommunityIcons dans Text */}
                  <MaterialCommunityIcons name="plus" size={16} color="#f97316" /> Ajouter
                </Text>
              </TouchableOpacity>
            </View>
            {ingredients.map((item, index) => (
              <View key={index} style={styles.ingredientRow}>
                <TextInput
                  style={[styles.input, styles.ingredientInput]}
                  placeholder="Nom de l'ingrédient"
                  placeholderTextColor="#9CA3AF"
                  value={item.name}
                  onChangeText={(value) => updateIngredient(index, 'name', value)}
                />
                <TextInput
                  style={[styles.input, styles.quantityInput]}
                  placeholder="Quantité"
                  placeholderTextColor="#9CA3AF"
                  value={item.quantity}
                  onChangeText={(value) => updateIngredient(index, 'quantity', value)}
                />
                <TouchableOpacity onPress={() => removeIngredient(index)}>
                  {/* Correction 8: Envelopper MaterialCommunityIcons dans Text */}
                  <Text>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color="#ef4444" />
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <TextInput
              style={[styles.input, styles.instructionsInput]}
              placeholder="Décrivez les étapes de préparation..."
              placeholderTextColor="#9CA3AF"
              value={instructions}
              onChangeText={setInstructions}
              multiline
              numberOfLines={6}
            />
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
                    {/* Correction 9: Envelopper MaterialCommunityIcons dans Text */}
                    <Text style={styles.buttonIcon}>
                      <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                    </Text>
                    <Text style={styles.publishButtonText}>Enregistrer les Modifications</Text> 
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
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  addText: { fontSize: 14, color: '#f97316', fontWeight: '500' },
  inputContainer: { marginBottom: 16 },
  halfWidth: { flex: 1 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
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
    padding: 12,
    marginBottom: 12,
  },
  ingredientInput: { flex: 2 },
  quantityInput: { flex: 1, textAlign: 'right' },
  instructionsInput: { textAlignVertical: 'top' },
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

export default EditRecipeScreen;
