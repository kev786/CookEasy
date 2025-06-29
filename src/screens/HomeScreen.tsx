import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, Image, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { auth } from '../services/firebase';
import { db } from '../services/firebase';
import { collection, getDocs } from '@react-native-firebase/firestore';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

interface Plat {
  id: string;
  nom_plat?: string;
  Description?: string;
  autre_nom?: string;
  code_plat?: string;
  origine?: string;
  chemin?: string;
  code?: string;
  imageUrl?: string;
  type?: string;
  time?: string;
  calories?: number;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { familyProfile, recipes, setRecipes, shoppingList, stock } = useAppContext();
  const userName = auth.currentUser?.displayName || 'Famille';

  // Compteurs dynamiques
  const recipeCount = recipes.filter((recipe) => recipe.isPersonal).length;
  const shoppingItemCount = shoppingList.length;
  const stockItemCount = stock.length;

  // État pour le modal d'ajout de recette
  const [modalVisible, setModalVisible] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    id: recipes.length + 1,
    name: '',
    time: '',
    difficulty: '',
    image: '',
    calories: 0,
    ingredients: [''],
    isPersonal: true,
    budget: 0,
    availableIngredients: 0,
    creator: userName,
  });

  // État pour les plats recommandés et tous les plats
  const [recommendedPlats, setRecommendedPlats] = useState<Plat[]>([]);
  const [sectionTitle, setSectionTitle] = useState('🎯 Recommandé pour votre famille');
  const allPlatsRef = useRef<Plat[]>([]);
  const [, setCurrentIndex] = useState(0);

  // Charger les plats depuis Firestore
  const fetchPlats = async (): Promise<Plat[]> => {
    try {
      const querySnapshot = await getDocs(collection(db, 'plat'));
      const platsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Plat[];
      return platsData;
    } catch (error) {
      console.error('Erreur lors du chargement des plats :', error);
      return [];
    }
  };

  // Charger les plats au montage et gérer le changement périodique
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const loadPlats = async () => {
      const allPlats = await fetchPlats();
      if (allPlats.length > 0) {
        allPlatsRef.current = allPlats;
        setRecommendedPlats(allPlats.slice(0, 2));
        setSectionTitle('🎯 Recommandé pour votre famille');
        setCurrentIndex(0);

        intervalId = setInterval(() => {
          setCurrentIndex(prev => {
            const nextIndex = prev + 2 >= allPlatsRef.current.length ? 0 : prev + 2;
            setRecommendedPlats(allPlatsRef.current.slice(nextIndex, nextIndex + 2));
            setSectionTitle('🎯 Plats disponibles');
            return nextIndex;
          });
        }, 30000);
      }
    };

    loadPlats();

    return () => clearInterval(intervalId);
  }, []);

  const handleAddRecipe = () => {
    if (newRecipe.name && newRecipe.time && newRecipe.difficulty && newRecipe.calories && newRecipe.budget) {
      setRecipes([...recipes, newRecipe]);
      setModalVisible(false);
      setNewRecipe({
        id: recipes.length + 2,
        name: '',
        time: '',
        difficulty: '',
        image: '',
        calories: 0,
        ingredients: [''],
        isPersonal: true,
        budget: 0,
        availableIngredients: 0,
        creator: userName,
      });
    } else {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs principaux.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>CuisineAI</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Profil famille */}
        <View style={styles.familyCard}>
          <View style={styles.familyHeader}>
            <Text style={styles.familyTitle}>👨‍👩‍👧 {userName}</Text>
            <MaterialCommunityIcons name="pencil" size={20} color="#6B7280" />
          </View>
          <View style={styles.membersContainer}>
            {familyProfile.members.map((member, idx) => (
              <View key={idx} style={styles.memberTag}>
                <Text style={styles.memberText}>
                  {member.name} ({member.age} ans)
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Actions rapides */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Recipes')}
          >
            <LinearGradient colors={['#fb923c', '#f97316']} style={styles.gradientAction}>
              <MaterialCommunityIcons name="chef-hat" size={32} color="#fff" style={styles.actionIcon} />
              <View>
                <Text style={styles.actionTitle}>Mes Recettes</Text>
                <Text style={styles.actionSubtitle}>{recipeCount} recettes</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.gradientAction}>
              <Text style={styles.aiIcon}>✨</Text>
              <View>
                <Text style={styles.actionTitle}>Chef IA</Text>
                <Text style={styles.actionSubtitle}>Suggestions</Text>
              </View>
              <View style={styles.pulseDot} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.smallActionCard}
            onPress={() => navigation.navigate('Shopping')}
          >
            <LinearGradient colors={['#60a5fa', '#3b82f6']} style={styles.gradientSmallAction}>
              <MaterialCommunityIcons name="cart-outline" size={24} color="#fff" style={styles.smallActionIcon} />
              <View>
                <Text style={styles.smallActionTitle}>Courses</Text>
                <Text style={styles.smallActionSubtitle}>{shoppingItemCount} articles</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.smallActionCard}
            onPress={() => navigation.navigate('Stock')}
          >
            <LinearGradient colors={['#34d399', '#16a34a']} style={styles.gradientSmallAction}>
              <MaterialCommunityIcons name="package-variant-closed" size={24} color="#fff" style={styles.smallActionIcon} />
              <View>
                <Text style={styles.smallActionTitle}>Mon Stock</Text>
                <Text style={styles.smallActionSubtitle}>{stockItemCount} produits</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Bouton flottant pour ajouter une recette */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Section des plats recommandés/disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{sectionTitle}</Text>
          {recommendedPlats.map((plat, index) => (
            <View key={index} style={styles.recipeCard}>
              <Image
                source={{ uri: plat.imageUrl || 'https://via.placeholder.com/50' }}
                style={styles.recipeImage}
              />
              <View style={styles.recipeInfo}>
                <Text style={styles.recipeName}>{plat.nom_plat || 'Plat inconnu'}</Text>
                <View style={styles.recipeDetails}>
                  <Text style={styles.detailText}>
                    ⏱️ {plat.time || (plat.Description ? `${Math.round(plat.Description.length / 10)} min` : 'N/A')}
                  </Text>
                  <Text style={styles.detailText}>
                    🔥 {plat.calories || 0} cal
                  </Text>
                </View>
                <Text style={styles.descriptionText}>
                  {plat.Description || 'Aucune description'}
                </Text>
                <Text style={styles.originText}>
                  Origine: {plat.origine || 'Inconnue'}
                </Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton}>
                <MaterialCommunityIcons name="heart-outline" size={20} color="#f97316" />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Alertes stock */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertDot} />
            <Text style={styles.alertTitle}>Alertes Stock</Text>
          </View>
          <Text style={styles.alertText}>
            Yaourts expirent dans 2 jours • Lait expire bientôt
          </Text>
        </View>
      </ScrollView>

      {/* Modal pour ajouter une recette */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter une recette</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom de la recette"
              value={newRecipe.name}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Temps (ex: 1h 30min)"
              value={newRecipe.time}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, time: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Difficulté (ex: Facile)"
              value={newRecipe.difficulty}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, difficulty: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              value={newRecipe.calories.toString()}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, calories: parseInt(text, 10) || 0 })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Budget (FCFA)"
              value={newRecipe.budget.toString()}
              onChangeText={(text) => setNewRecipe({ ...newRecipe, budget: parseFloat(text) || 0 })}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // ...styles identiques à ta version précédente...
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
  scrollView: { flex: 1 },
  content: { padding: 16 },
  familyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  familyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  familyTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  membersContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  memberTag: {
    backgroundColor: '#ffedd5',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  memberText: { fontSize: 14, color: '#f97316' },
  actionGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionCard: { flex: 1 },
  gradientAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
  },
  actionIcon: { marginRight: 16 },
  actionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  actionSubtitle: { fontSize: 14, color: '#fff', opacity: 0.9 },
  smallActionCard: { flex: 1 },
  gradientSmallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
  },
  smallActionIcon: { marginRight: 12 },
  smallActionTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  smallActionSubtitle: { fontSize: 12, color: '#fff', opacity: 0.9 },
  aiIcon: { fontSize: 24, marginRight: 16 },
  pulseDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    backgroundColor: '#facc15',
    borderRadius: 4,
  },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 16 },
  recipeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 2,
  },
  recipeImage: { width: 50, height: 50, marginRight: 16, borderRadius: 8 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  recipeDetails: { flexDirection: 'row', gap: 12 },
  detailText: { fontSize: 14, color: '#6B7280' },
  descriptionText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  originText: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  favoriteButton: { padding: 8 },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#a855f7',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  addButton: {
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  alertCard: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 16,
    padding: 16,
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertDot: { width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#b91c1c' },
  alertText: { fontSize: 14, color: '#b91c1c' },
});

export default HomeScreen;
