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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'AddShoppingItem'>;

const AddShoppingItem: React.FC<Props> = ({ navigation }) => {
  const { shoppingList, setShoppingList } = useAppContext();
  const [item, setItem] = useState('');
  const [category, setCategory] = useState('Féculents');
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const categories = ['Féculents', 'Viande', 'Frais', 'Fromage', 'Légumes'];

  const handleAddItem = () => {
    if (!item.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un article.');
      return;
    }

    const newItem = { item: item.trim(), bought: false, category };
    setShoppingList([...shoppingList, newItem]);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ajouter un article</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Article</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="cart-outline" size={20} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Pommes (1kg)"
                placeholderTextColor="#9CA3AF"
                value={item}
                onChangeText={setItem}
                autoCapitalize="sentences"
              />
            </View>
          </View>

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

          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Text style={styles.addButtonText}>Ajouter à la liste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => navigation.navigate('AIGenerate')}
          >
            <Text style={styles.aiButtonText}>Générer avec l'IA</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour choisir la catégorie */}
      <Modal visible={showCategoryModal} transparent animationType="fade">
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
  addButton: {
    backgroundColor: '#f97316',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
});

export default AddShoppingItem;
