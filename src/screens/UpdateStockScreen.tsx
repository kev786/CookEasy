// src/screens/UpdateStockScreen.tsx

import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Button, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, StockItem } from '../types';
import { useAppContext } from '../context/AppContext';

// Définir les props de l'écran pour la navigation
type Props = NativeStackScreenProps<RootStackParamList, 'UpdateStock'>;

const UpdateStockScreen: React.FC<Props> = ({ navigation, route }) => {
  // Récupérer l'élément à éditer passé via les paramètres de navigation
  const { itemToEdit } = route.params;
  const { stock, setStock } = useAppContext();

  // États locaux pour les champs du formulaire, initialisés avec les valeurs de l'élément à éditer
  const [name, setName] = useState(itemToEdit.name);
  const [quantity, setQuantity] = useState(String(itemToEdit.quantity)); // Convertir en string pour TextInput
  const [expiry, setExpiry] = useState(itemToEdit.expiry); // Garder comme string, considérer un DatePicker pour la production
  const [status, setStatus] = useState<'good' | 'warning' | 'urgent'>(itemToEdit.status);

  // Fonction pour gérer la sauvegarde des modifications
  const handleSave = () => {
    // --- Validation des entrées ---
    if (!name.trim() || !quantity.trim() || !expiry.trim()) {
      Alert.alert('Erreur', 'Tous les champs sont obligatoires.');
      return;
    }
    const parsedQuantity = parseInt(quantity, 10);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Erreur', 'La quantité doit être un nombre positif.');
      return;
    }
    // Validation simple de la date (vous pouvez la rendre plus robuste)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiry)) {
        Alert.alert('Erreur', 'Le format de la date doit être AAAA-MM-JJ.');
        return;
    }
    // --- Fin de la validation ---

    // Créer un nouvel objet avec les données mises à jour
    const updatedItem: StockItem = {
      ...itemToEdit, // Conserver l'ID et toute autre propriété non modifiable
      name: name.trim(),
      quantity: parsedQuantity,
      expiry: expiry.trim(),
      status: status, // Le statut peut être recalculé ici si vous le souhaitez en fonction de la nouvelle date
    };

    // Mettre à jour le stock global via le contexte
    setStock(prevStock =>
      prevStock.map(item => (item.id === updatedItem.id ? updatedItem : item))
    );

    Alert.alert('Succès', 'Produit mis à jour avec succès !');
    navigation.goBack(); // Revenir à l'écran précédent (StockScreen)
  };

  return (
    <View style={styles.container}>
      {/* En-tête de la page */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier "{itemToEdit.name}"</Text>
          <View style={styles.headerIcons}>
            {/* Vous pouvez ajouter des icônes spécifiques à l'édition si besoin */}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Nom du produit :</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Lait"
        />

        <Text style={styles.label}>Quantité :</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
          placeholder="Ex: 2"
        />

        <Text style={styles.label}>Date d'expiration (AAAA-MM-JJ) :</Text>
        <TextInput
          style={styles.input}
          value={expiry}
          onChangeText={setExpiry}
          placeholder="Ex: 2025-12-31"
          // Considérer d'intégrer un DatePicker ici pour une meilleure UX
        />

        {/* Sélection du statut (vous pouvez lier cela à la date d'expiration pour l'automatiser) */}
        <Text style={styles.label}>Statut :</Text>
        <View style={styles.statusOptions}>
          <TouchableOpacity
            style={[styles.statusButton, status === 'good' && styles.statusButtonSelectedGood]}
            onPress={() => setStatus('good')}
          >
            <Text style={status === 'good' ? styles.statusTextSelected : styles.statusText}>Bon état</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, status === 'warning' && styles.statusButtonSelectedWarning]}
            onPress={() => setStatus('warning')}
          >
            <Text style={status === 'warning' ? styles.statusTextSelected : styles.statusText}>Attention</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, status === 'urgent' && styles.statusButtonSelectedUrgent]}
            onPress={() => setStatus('urgent')}
          >
            <Text style={status === 'urgent' ? styles.statusTextSelected : styles.statusText}>Urgent</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton de sauvegarde */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.gradientSaveButton}>
            <Text style={styles.saveButtonText}>Enregistrer les modifications</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', flex: 1, textAlign: 'center' },
  headerIcons: { width: 24 }, // Espace réservé pour l'alignement du titre
  formContainer: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  statusOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 20,
  },
  statusButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 4,
  },
  statusButtonSelectedGood: {
    backgroundColor: '#d1fae5',
    borderColor: '#16a34a',
  },
  statusButtonSelectedWarning: {
    backgroundColor: '#fefce8',
    borderColor: '#ca8a04',
  },
  statusButtonSelectedUrgent: {
    backgroundColor: '#fef2f2',
    borderColor: '#b91c1c',
  },
  statusText: {
    color: '#666',
    fontWeight: '500',
  },
  statusTextSelected: {
    fontWeight: 'bold',
    color: '#333',
  },
  saveButton: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientSaveButton: {
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});

export default UpdateStockScreen;