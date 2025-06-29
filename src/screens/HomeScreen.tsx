import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal, Platform } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';
import { auth } from '../services/firebase';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  // Changement ici : shoppingList est remplacé par shoppingLists
  const { familyProfile, recipes, setRecipes, shoppingLists, stock } = useAppContext();
  const userName = auth.currentUser?.displayName || 'Famille';

  // Calculer le nombre total d'articles de toutes les listes de courses
  const shoppingItemCount = shoppingLists.reduce((total, list) => total + list.items.length, 0);

  // Compteurs dynamiques
  const recipeCount = recipes.filter((recipe) => recipe.isPersonal).length;
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
      // Remplacer alert() par une alerte personnalisée ou un message dans l'UI
      console.warn('Veuillez remplir tous les champs principaux.');
      // Vous pourriez utiliser un état pour afficher un message d'erreur sur l'écran
      // Par exemple : setErrorMesssage('Veuillez remplir tous les champs principaux.');
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
            <TouchableOpacity onPress={() => {/* Gérer la modification du profil */}}>
              <MaterialCommunityIcons name="pencil" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.membersContainer}>
            {familyProfile.members.length > 0 ? (
              familyProfile.members.map((member, idx) => (
                <View key={idx} style={styles.memberTag}>
                  <Text style={styles.memberText}>
                    {member.name} ({member.age} ans)
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.noMemberText}>Ajoutez des membres de votre famille pour personnaliser vos recettes!</Text>
            )}
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

          <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AIGenerate')}>
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

        {/* Bouton flottant pour ajouter une recette (maintenu car c'était là avant) */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Recettes recommandées */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Recommandé pour votre famille</Text>
          <View style={styles.recipeCard}>
            <Text style={styles.recipeImage}>🍚</Text>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>Riz Sauce Arachide</Text>
              <View style={styles.recipeDetails}>
                <Text style={styles.detailText}>⏱️ 1h</Text>
                <Text style={styles.detailText}>🔥 600 cal</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <MaterialCommunityIcons name="heart-outline" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>
          <View style={styles.recipeCard}>
            <Text style={styles.recipeImage}>🥗</Text>
            <View style={styles.recipeInfo}>
              <Text style={styles.recipeName}>Salade à l'Avocat</Text>
              <View style={styles.recipeDetails}>
                <Text style={styles.detailText}>⏱️ 20 min</Text>
                <Text style={styles.detailText}>🔥 300 cal</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.favoriteButton}>
              <MaterialCommunityIcons name="heart-outline" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Alertes stock */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <View style={styles.alertDot} />
            <Text style={styles.alertTitle}>Alertes Stock</Text>
          </View>
          {stock.filter(item => item.status === 'urgent' || item.status === 'warning').length > 0 ? (
            <Text style={styles.alertText}>
              {stock.filter(item => item.status === 'urgent').map(item => `${item.name} expirent dans 2 jours`).join(' • ')}
              {stock.filter(item => item.status === 'warning').map(item => `${item.name} expire bientôt`).join(' • ')}
            </Text>
          ) : (
            <Text style={styles.alertText}>Aucune alerte de stock pour le moment.</Text>
          )}
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
              onChangeText={(text) => setNewRecipe({ ...newRecipe, calories: parseInt(text, 10) || 0 })} // Ajout de radix: 10
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
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  scrollView: { flex: 1 },
  content: { padding: 16 },
  familyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  noMemberText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  actionGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  actionCard: { flex: 1 },
  gradientAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  recipeImage: { fontSize: 40, marginRight: 16 },
  recipeInfo: { flex: 1 },
  recipeName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  recipeDetails: { flexDirection: 'row', gap: 12 },
  detailText: { fontSize: 14, color: '#6B7280' },
  favoriteButton: { padding: 8 },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#a855f7', // Déplacé du style en ligne
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
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
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
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
    marginBottom: 24, // Added margin-bottom for spacing
  },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  alertDot: { width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4 },
  alertTitle: { fontSize: 16, fontWeight: '600', color: '#b91c1c' },
  alertText: { fontSize: 14, color: '#b91c1c' },
});

export default HomeScreen;

// Cette fonction 'alert' n'est pas nécessaire et peut être supprimée si vous utilisez
// des modales personnalisées ou console.warn pour les messages d'alerte.
// function alert(_arg0: string) {
//   throw new Error('Function not implemented.');
// }