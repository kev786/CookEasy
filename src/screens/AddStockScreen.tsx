import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Platform 
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import DateTimePicker from '@react-native-community/datetimepicker'; 
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

// Définition des props pour cet écran
type Props = NativeStackScreenProps<RootStackParamList, 'AddStock'>;

const AddStockScreen: React.FC<Props> = ({ navigation }) => {
  // Récupération de la fonction setStock depuis le contexte de l'application
  const { setStock } = useAppContext();

  // État local pour le nouvel élément de stock à ajouter
  const [newItem, setNewItem] = useState({ 
    name: '', 
    quantity: '', 
    expiry: '', 
    status: 'good' as 'good' | 'warning' | 'urgent' 
  });

  // État pour gérer l'affichage du sélecteur de date
  const [showDatePicker, setShowDatePicker] = useState(false);
  // État pour la date sélectionnée dans le sélecteur, initialisée à aujourd'hui
  const [selectedDate, setSelectedDate] = useState(new Date());

  /**
   * Gère le changement de date depuis le sélecteur de date.
   * Met à jour la date d'expiration dans newItem et masque le sélecteur.
   */
  const onDateChange = (event: any, chosenDate?: Date) => {
    // Masque le sélecteur de date après sélection (ou annulation)
    setShowDatePicker(Platform.OS === 'ios'); 
    if (chosenDate) {
      setSelectedDate(chosenDate);
      // Formatage de la date en 'YYYY-MM-DD'
      const formattedDate = chosenDate.toISOString().split('T')[0];
      setNewItem({ ...newItem, expiry: formattedDate });
    }
  };

  /**
   * Affiche le sélecteur de date.
   */
  const handleShowDatePicker = () => {
    setShowDatePicker(true);
  };

  /**
   * Gère l'ajout d'un nouvel élément au stock.
   * Valide les champs et ajoute l'élément via la fonction setStock du contexte.
   * Retourne à l'écran précédent après l'ajout.
   */
  const handleAddStock = () => {
    if (newItem.name && newItem.quantity && newItem.expiry) {
      setStock((prevStock) => [
        ...prevStock, 
        { ...newItem, expiry: new Date(newItem.expiry).toISOString().split('T')[0] }
      ]);
      
      setNewItem({ name: '', quantity: '', expiry: '', status: 'good' });
      navigation.goBack();
    } else {
      console.warn('Veuillez remplir tous les champs.'); 
    }
  };

  return (
    <View style={styles.container}>
      {/* En-tête de la page */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Bouton de retour à l'écran précédent */}
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          {/* Titre de l'écran */}
          <Text style={styles.headerTitle}>Ajouter un produit</Text>
          {/* Espacement pour centrer le titre, ou icônes futures si nécessaire */}
          <View style={styles.headerIconsPlaceholder} /> 
        </View>
      </LinearGradient>

      {/* Zone de défilement pour le contenu du formulaire */}
      <ScrollView contentContainerStyle={styles.formContent}>
        {/* Champ de saisie pour le nom du produit */}
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="package-variant-closed" size={20} color="#374151" style={styles.labelIcon} />
          <Text style={styles.inputLabel}>Nom du produit</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Ex: Lait, Sucre, Riz"
          value={newItem.name}
          onChangeText={(text) => setNewItem({ ...newItem, name: text })}
        />
        
        {/* Champ de saisie pour la quantité */}
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="weight-kilogram" size={20} color="#374151" style={styles.labelIcon} />
          <Text style={styles.inputLabel}>Quantité</Text>
        </View>
        <TextInput
          style={styles.input}
          placeholder="Ex: 500g, 2 kg, 1 douzaine"
          value={newItem.quantity}
          onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
        />
        
        {/* Champ de sélection de la date d'expiration */}
        <View style={styles.labelContainer}>
          <MaterialCommunityIcons name="calendar" size={20} color="#374151" style={styles.labelIcon} />
          <Text style={styles.inputLabel}>Date d'expiration</Text>
        </View>
        <TouchableOpacity style={styles.input} onPress={handleShowDatePicker}>
          <Text style={newItem.expiry ? styles.dateText : styles.datePlaceholder}>
            {newItem.expiry || "Sélectionnez une date (AAAA-MM-JJ)"}
          </Text>
        </TouchableOpacity>
        
        {/* Sélecteur de date conditionnel */}
        {showDatePicker && (
          <DateTimePicker
            testID="dateTimePicker"
            value={selectedDate}
            mode="date" 
            display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
            onChange={onDateChange}
            minimumDate={new Date()} 
          />
        )}
        
        {/* Section de sélection du statut */}
        <View style={styles.labelContainer}>
            <MaterialCommunityIcons name="information" size={20} color="#374151" style={styles.labelIcon} />
            <Text style={styles.statusLabel}>Statut :</Text>
        </View>
        <View style={styles.statusContainer}>
          {/* Bouton pour le statut "Bon état" */}
          <TouchableOpacity
            style={[
              styles.statusButton, 
              newItem.status === 'good' && styles.statusSelectedGood
            ]}
            onPress={() => setNewItem({ ...newItem, status: 'good' })}
          >
            <Text style={[
              styles.statusText, 
              newItem.status === 'good' && styles.statusTextSelected
            ]}>Bon état</Text>
          </TouchableOpacity>
          
          {/* Bouton pour le statut "Attention" */}
          <TouchableOpacity
            style={[
              styles.statusButton, 
              newItem.status === 'warning' && styles.statusSelectedWarning
            ]}
            onPress={() => setNewItem({ ...newItem, status: 'warning' })}
          >
            <Text style={[
              styles.statusText, 
              newItem.status === 'warning' && styles.statusTextSelected
            ]}>Attention</Text>
          </TouchableOpacity>
          
          {/* Bouton pour le statut "Urgent" */}
          <TouchableOpacity
            style={[
              styles.statusButton, 
              newItem.status === 'urgent' && styles.statusSelectedUrgent
            ]}
            onPress={() => setNewItem({ ...newItem, status: 'urgent' })}
          >
            <Text style={[
              styles.statusText, 
              newItem.status === 'urgent' && styles.statusTextSelected
            ]}>Urgent</Text>
          </TouchableOpacity>
        </View>

        {/* Bouton d'ajout du produit */}
        <TouchableOpacity style={styles.addButton} onPress={handleAddStock}>
          <Text style={styles.addButtonText}>Ajouter le produit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F3F4F6' 
  },
  header: { 
    paddingTop: 48, 
    paddingBottom: 16, 
    paddingHorizontal: 16 
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#fff' 
  },
  headerIconsPlaceholder: { 
    width: 24, 
    marginHorizontal: 8,
  },
  formContent: { 
    padding: 16, 
    flexGrow: 1, 
    justifyContent: 'center', 
  },
  labelContainer: { // Nouveau style pour le conteneur icône + label
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 12,
  },
  labelIcon: { // Nouveau style pour l'icône du label
    marginRight: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151', 
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB', 
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#fff', 
    justifyContent: 'center', 
  },
  dateText: {
    fontSize: 16,
    color: '#1F2937',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#6B7280', 
  },
  statusContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginTop: 8,
    marginBottom: 24,
    backgroundColor: '#E5E7EB', 
    borderRadius: 12,
    padding: 6,
  },
  statusLabel: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#374151', 
    // marginBottom: 10, // Retiré car le labelContainer gère déjà l'espacement
  },
  statusButton: {
    flex: 1, 
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4, 
    backgroundColor: 'transparent', 
  },
  statusSelectedGood: { 
    backgroundColor: '#d1fae5', 
    borderWidth: 1, 
    borderColor: '#16a34a' 
  },
  statusSelectedWarning: { 
    backgroundColor: '#fefce8', 
    borderWidth: 1, 
    borderColor: '#ca8a04' 
  },
  statusSelectedUrgent: { 
    backgroundColor: '#fef2f2', 
    borderWidth: 1, 
    borderColor: '#b91c1c' 
  },
  statusText: { 
    fontSize: 14, 
    fontWeight: '500', 
    color: '#4B5563', 
  },
  statusTextSelected: {
    fontWeight: 'bold', 
    color: '#1F2937', 
  },
  addButton: {
    backgroundColor: '#a855f7', 
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20, 
    elevation: 3, 
  },
  addButtonText: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#fff' 
  },
});

export default AddStockScreen;
