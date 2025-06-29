import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView, // Ajout de KeyboardAvoidingView
  Platform, // Pour la détection de la plateforme
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ShoppingItem } from '../types'; // Assurez-vous que ShoppingItem est importé de types
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddShoppingItem'>;

const AddShoppingItem: React.FC<Props> = ({ navigation }) => {
  const { addShoppingList } = useAppContext();

  // États pour la nouvelle liste de courses
  const [listName, setListName] = useState('');
  const [currentNewListItems, setCurrentNewListItems] = useState<ShoppingItem[]>([]);
  
  // États pour les détails du nouvel article
  const [itemInput, setItemInput] = useState('');
  const [quantity, setQuantity] = useState(''); // Quantité en string pour l'input
  const [unit, setUnit] = useState('unité'); // Unité par défaut
  const [unitPrice, setUnitPrice] = useState(''); // Prix unitaire en string
  const [category, setCategory] = useState('Féculents');

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showUnitModal, setShowUnitModal] = useState(false); // Pour le modal d'unité

  const categories = ['Féculents', 'Viande', 'Frais', 'Fromage', 'Légumes', 'Boissons', 'Produits Laitiers', 'Boulangerie', 'Autres'];
  const units = ['unité', 'kg', 'litre', 'paquet', 'boîte', 'bouteille', 'g', 'ml']; // Exemples d'unités

  // Fonction pour ajouter un article à la liste EN COURS DE CRÉATION
  const handleAddItemToCurrentList = () => {
    const parsedQuantity = parseFloat(quantity.replace(',', '.')); // Gérer la virgule comme séparateur décimal
    const parsedUnitPrice = parseFloat(unitPrice.replace(',', '.'));

    if (!itemInput.trim() || isNaN(parsedQuantity) || parsedQuantity <= 0 || isNaN(parsedUnitPrice) || parsedUnitPrice < 0) {
      Alert.alert('Erreur', 'Veuillez remplir correctement le nom, la quantité et le prix unitaire.');
      return;
    }

    const newItem: ShoppingItem = {
      id: Date.now().toString(), // Générer un ID unique pour l'article
      item: itemInput.trim(),
      bought: false,
      category,
      quantity: parsedQuantity,
      unit: unit,
      unitPrice: parsedUnitPrice,
      priceEstimate: parsedQuantity * parsedUnitPrice, // Calcul du prix total
    };

    setCurrentNewListItems((prevItems) => [...prevItems, newItem]);
    // Réinitialiser les inputs de l'article après ajout
    setItemInput('');
    setQuantity('');
    setUnitPrice('');
    setCategory('Féculents');
    setUnit('unité');
  };

  // Fonction pour supprimer un article de la liste EN COURS DE CRÉATION
  const handleRemoveItem = (itemId: string) => {
    setCurrentNewListItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
  };

  // Fonction pour enregistrer la liste complète
  const handleSaveNewList = () => {
    if (!listName.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre liste.');
      return;
    }
    if (currentNewListItems.length === 0) {
      Alert.alert('Erreur', 'Veuillez ajouter au moins un article à la liste.');
      return;
    }

    // Appel de la fonction du contexte pour ajouter la nouvelle liste
    addShoppingList(listName.trim(), currentNewListItems);
    Alert.alert('Succès', `La liste "${listName.trim()}" a été créée avec ${currentNewListItems.length} articles !`);
    navigation.goBack(); // Revenir à l'écran précédent (ShoppingScreen)
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={styles.listItem}>
      <Text style={styles.listItemText}>
        {item.item} ({item.quantity} {item.unit}) - {item.priceEstimate.toFixed(2)} FCFA
      </Text>
      <Text style={styles.listItemCategory}>({item.category})</Text>
      <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
        <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20} // Ajustement pour Android si nécessaire
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Créer une Nouvelle Liste</Text>
        </View>

        <View style={styles.form}>
          {/* Nom de la liste */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom de la liste</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="format-list-bulleted" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Courses de la semaine, Courses du mois"
                placeholderTextColor="#9CA3AF"
                value={listName}
                onChangeText={setListName}
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {/* Section d'ajout de nouvel article */}
          <View style={styles.sectionDivider}>
            <Text style={styles.sectionTitle}>Ajouter un article</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Article</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="cart-plus" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Pommes"
                placeholderTextColor="#9CA3AF"
                value={itemInput}
                onChangeText={setItemInput}
                autoCapitalize="sentences"
              />
            </View>
          </View>

          {/* Quantité et Unité */}
          <View style={styles.rowInputContainer}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Quantité</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="numeric" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ex: 2.5"
                  placeholderTextColor="#9CA3AF"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Unité</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons name="ruler" size={20} color="#9CA3AF" style={styles.inputIcon} />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowUnitModal(true)}
                >
                  <Text style={styles.modalText}>{unit}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Prix Unitaire */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Prix Unitaire (FCFA)</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="cash" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 500"
                placeholderTextColor="#9CA3AF"
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Catégorie */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Catégorie</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="tag-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowCategoryModal(true)}
              >
                <Text style={styles.modalText}>{category}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Bouton pour ajouter l'article à la liste temporaire */}
          <TouchableOpacity style={styles.addItemButton} onPress={handleAddItemToCurrentList}>
            <Text style={styles.addItemButtonText}>Ajouter cet article à la liste</Text>
          </TouchableOpacity>

          {/* Affichage des articles déjà ajoutés à cette liste */}
          {currentNewListItems.length > 0 && (
            <View style={styles.currentItemsContainer}>
              <Text style={styles.currentItemsTitle}>Articles dans cette liste :</Text>
              <FlatList
                data={currentNewListItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Empêche le défilement de la FlatList elle-même
              />
              <Text style={styles.totalPrice}>
                Total estimé :{' '}
                {currentNewListItems.reduce((sum, item) => sum + item.priceEstimate, 0).toFixed(2)} FCFA
              </Text>
            </View>
          )}

          {/* Bouton pour enregistrer la liste complète */}
          <TouchableOpacity style={styles.saveListButton} onPress={handleSaveNewList}>
            <Text style={styles.saveListButtonText}>Enregistrer la liste complète</Text>
          </TouchableOpacity>

          {/* Bouton Générer avec l'IA */}
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIGenerate')}
          >
            <Text style={styles.aiButtonText}>Générer la liste avec l'IA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour choisir la catégorie */}
      <Modal visible={showCategoryModal} transparent animationType="fade" onRequestClose={() => setShowCategoryModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.modalItem, category === cat && styles.modalItemSelected]}
                onPress={() => {
                  setCategory(cat);
                  setShowCategoryModal(false);
                }}
              >
                <Text
                  style={[styles.modalItemText, category === cat && styles.modalItemTextSelected]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal pour choisir l'unité */}
      <Modal visible={showUnitModal} transparent animationType="fade" onRequestClose={() => setShowUnitModal(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUnitModal(false)}
        >
          <View style={styles.modalContent}>
            {units.map((u) => (
              <TouchableOpacity
                key={u}
                style={[styles.modalItem, unit === u && styles.modalItemSelected]}
                onPress={() => {
                  setUnit(u);
                  setShowUnitModal(false);
                }}
              >
                <Text
                  style={[styles.modalItemText, unit === u && styles.modalItemTextSelected]}
                >
                  {u}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
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
    paddingHorizontal: 0,
  },
  inputIcon: { marginLeft: 12 },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalText: { fontSize: 16, color: '#1F2937' },
  addItemButton: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  addItemButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  currentItemsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentItemsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listItemText: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  listItemCategory: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    marginRight: 10,
  },
  totalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 10,
    textAlign: 'right',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  saveListButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  saveListButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  aiButton: {
    backgroundColor: '#a855f7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  aiButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: '#FFF7ED',
  },
  modalItemTextSelected: {
    color: '#f97316',
    fontWeight: '600',
  },
  rowInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16, // Espace entre les éléments
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1, // Chaque élément prend la moitié de la largeur disponible
    marginBottom: 0, // Réinitialiser le margin-bottom pour les éléments dans la rangée
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
  },
});

export default AddShoppingItem;