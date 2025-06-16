    import React, { useState, useEffect } from 'react';
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
    type Props = NativeStackScreenProps<RootStackParamList, 'EditStock'>; // Notez 'EditStock' ici

    const EditStockScreen: React.FC<Props> = ({ navigation, route }) => {
      const { setStock } = useAppContext();
      // Récupérer l'élément et son index passés via la navigation
      const { item: initialItem, itemIndex } = route.params;

      // État local pour les champs du formulaire, initialisé avec les données de l'élément existant
      const [editedItem, setEditedItem] = useState({
        name: initialItem.name,
        quantity: initialItem.quantity,
        expiry: initialItem.expiry,
        status: initialItem.status as 'good' | 'warning' | 'urgent',
      });

      const [showDatePicker, setShowDatePicker] = useState(false);
      // Utiliser la date de l'élément existant pour initialiser le sélecteur
      const [selectedDate, setSelectedDate] = useState(new Date(initialItem.expiry));

      // Mettre à jour l'état de la date si l'élément initial change (utile si on réutilise le composant)
      useEffect(() => {
        if (initialItem.expiry) {
          setSelectedDate(new Date(initialItem.expiry));
        }
      }, [initialItem.expiry]);


      const onDateChange = (event: any, chosenDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios'); 
        if (chosenDate) {
          setSelectedDate(chosenDate);
          const formattedDate = chosenDate.toISOString().split('T')[0];
          setEditedItem({ ...editedItem, expiry: formattedDate });
        }
      };

      const handleShowDatePicker = () => {
        setShowDatePicker(true);
      };

      /**
       * Gère la mise à jour de l'élément de stock existant.
       * Valide les champs et met à jour l'élément via la fonction setStock du contexte.
       * Retourne à l'écran précédent après la mise à jour.
       */
      const handleUpdateStock = () => {
        if (editedItem.name && editedItem.quantity && editedItem.expiry) {
          setStock((prevStock) => 
            prevStock.map((item, idx) => 
              idx === itemIndex ? { ...editedItem, expiry: new Date(editedItem.expiry).toISOString().split('T')[0] } : item
            )
          );
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
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Modifier produit</Text>
              <View style={styles.headerIconsPlaceholder} /> 
            </View>
          </LinearGradient>

          <ScrollView contentContainerStyle={styles.formContent}>
            {/* Champs de saisie pré-remplis */}
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="package-variant-closed" size={20} color="#374151" style={styles.labelIcon} />
              <Text style={styles.inputLabel}>Nom du produit</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Nom du produit"
              value={editedItem.name}
              onChangeText={(text) => setEditedItem({ ...editedItem, name: text })}
            />
            
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="weight-kilogram" size={20} color="#374151" style={styles.labelIcon} />
              <Text style={styles.inputLabel}>Quantité</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Quantité (ex: 500g, 2 kg)"
              value={editedItem.quantity}
              onChangeText={(text) => setEditedItem({ ...editedItem, quantity: text })}
            />
            
            <View style={styles.labelContainer}>
              <MaterialCommunityIcons name="calendar" size={20} color="#374151" style={styles.labelIcon} />
              <Text style={styles.inputLabel}>Date d'expiration</Text>
            </View>
            <TouchableOpacity style={styles.input} onPress={handleShowDatePicker}>
              <Text style={editedItem.expiry ? styles.dateText : styles.datePlaceholder}>
                {editedItem.expiry || "Sélectionnez une date (AAAA-MM-JJ)"}
              </Text>
            </TouchableOpacity>
            
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
            
            <View style={styles.labelContainer}>
                <MaterialCommunityIcons name="information" size={20} color="#374151" style={styles.labelIcon} />
                <Text style={styles.statusLabel}>Statut :</Text>
            </View>
            <View style={styles.statusContainer}>
              <TouchableOpacity
                style={[
                  styles.statusButton, 
                  editedItem.status === 'good' && styles.statusSelectedGood
                ]}
                onPress={() => setEditedItem({ ...editedItem, status: 'good' })}
              >
                <Text style={[
                  styles.statusText, 
                  editedItem.status === 'good' && styles.statusTextSelected
                ]}>Bon état</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton, 
                  editedItem.status === 'warning' && styles.statusSelectedWarning
                ]}
                onPress={() => setEditedItem({ ...editedItem, status: 'warning' })}
              >
                <Text style={[
                  styles.statusText, 
                  editedItem.status === 'warning' && styles.statusTextSelected
                ]}>Attention</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton, 
                  editedItem.status === 'urgent' && styles.statusSelectedUrgent
                ]}
                onPress={() => setEditedItem({ ...editedItem, status: 'urgent' })}
              >
                <Text style={[
                  styles.statusText, 
                  editedItem.status === 'urgent' && styles.statusTextSelected
                ]}>Urgent</Text>
              </TouchableOpacity>
            </View>

            {/* Bouton de mise à jour du produit */}
            <TouchableOpacity style={styles.addButton} onPress={handleUpdateStock}>
              <Text style={styles.addButtonText}>Mettre à jour le produit</Text>
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
      labelContainer: { 
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        marginTop: 12,
      },
      labelIcon: { 
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

    export default EditStockScreen;
    