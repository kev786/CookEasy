/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native'; // Ajout de RouteProp
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebase';
import { doc, updateDoc, getDoc } from '@react-native-firebase/firestore';

// Définir les types des props
type AddMemberScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'AddMember'>;
  route: RouteProp<RootStackParamList, 'AddMember'>; // Utilisation de RouteProp
};

// Interface pour un membre de la famille
interface Member {
  name: string;
  ageInput: string;
  age?: number;
  activity: string;
  preferences: string[];
  allergies: string[];
  avatar: string;
}

const AddMemberScreen: React.FC<AddMemberScreenProps> = ({ navigation, route }) => {
  const [member, setMember] = useState<Member>({
    name: '',
    ageInput: '',
    activity: '',
    preferences: [],
    allergies: [],
    avatar: '👤',
    ...(route.params?.memberToEdit || {}),
  });
  const [newPreference, setNewPreference] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const activityOptions = [
    'École',
    'Bureau',
    'Sport',
    'Retraité',
    'Étudiant',
    'Télétravail',
    'Autre',
  ];

  const preferencesSuggestions = [
    'Épicé',
    'Sucré',
    'Salé',
    'Végétarien',
    'Protéiné',
    'Léger',
    'Consistant',
    'Bio',
    'Simple',
    'Exotique',
  ];

  const avatarOptions = ['👨', '👩', '👦', '👧', '👶', '👴', '👵', '👤'];

  const handleInputChange = (field: keyof Member, value: string) => {
    setMember(prev => ({ ...prev, [field]: value }));
  };

  const addPreference = (preference: string) => {
    if (preference && !member.preferences.includes(preference)) {
      setMember(prev => ({
        ...prev,
        preferences: [...prev.preferences, preference],
      }));
      setNewPreference('');
    }
  };

  const removePreference = (preference: string) => {
    setMember(prev => ({
      ...prev,
      preferences: prev.preferences.filter(p => p !== preference),
    }));
  };

  const addAllergy = (allergy: string) => {
    if (allergy && !member.allergies.includes(allergy)) {
      setMember(prev => ({
        ...prev,
        allergies: [...prev.allergies, allergy],
      }));
      setNewAllergy('');
    }
  };

  const removeAllergy = (allergy: string) => {
    setMember(prev => ({
      ...prev,
      allergies: prev.allergies.filter(a => a !== allergy),
    }));
  };

  const handleSave = async () => {
    if (!member.name.trim() || !member.ageInput) {
      Alert.alert('Erreur', 'Veuillez remplir au minimum le nom et l\'âge.');
      return;
    }

    const ageNumber = parseInt(member.ageInput, 10);
    if (isNaN(ageNumber) || ageNumber <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un âge valide.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      navigation.replace('Auth');
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        const data = snapshot.data();
        const existingMembers = data?.members || [];
        const newMemberData: Omit<Member, 'ageInput'> & { age: number } = {
          name: member.name,
          age: ageNumber,
          activity: member.activity || '',
          preferences: member.preferences,
          allergies: member.allergies,
          avatar: member.avatar,
        };

        let updatedMembers;
        if (route.params?.memberIndex !== undefined) {
          // Mode modification
          updatedMembers = [...existingMembers];
          updatedMembers[route.params.memberIndex] = newMemberData;
        } else {
          // Mode ajout
          updatedMembers = [...existingMembers, newMemberData];
        }

        await updateDoc(userDocRef, { members: updatedMembers });
        console.log('Membre sauvegardé:', newMemberData);
        navigation.goBack(); // Retour à la page précédente
      } else {
        Alert.alert('Erreur', 'Données utilisateur non trouvées.');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error.message);
      Alert.alert('Erreur', 'Échec de la sauvegarde: ' + (error.message || 'Erreur inconnue'));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {route.params?.memberToEdit ? 'Modifier un Membre' : 'Ajouter un Membre'}
          </Text>
          <TouchableOpacity onPress={handleSave}>
            <View style={styles.addButton}>
              <MaterialCommunityIcons name="check" size={16} color="#fff" />
              <Text style={styles.addButtonText}>Sauvegarder</Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {/* Avatar */}
        <View style={styles.section}>
          <View style={styles.avatarSection}>
            <Text style={styles.avatarEmoji}>{member.avatar}</Text>
            <Text style={styles.sectionSubtitle}>Choisissez un avatar</Text>
          </View>
          <View style={styles.avatarGrid}>
            {avatarOptions.map((avatar, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleInputChange('avatar', avatar)}
                style={[
                  styles.avatarOption,
                  member.avatar === avatar && styles.avatarOptionSelected,
                ]}
              >
                <Text style={styles.avatarEmojiOption}>{avatar}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Informations de Base</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom / Surnom *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Papa, Emma, Grand-mère..."
              value={member.name}
              onChangeText={value => handleInputChange('name', value)}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.row}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Âge *</Text>
              <TextInput
                style={styles.input}
                placeholder="25"
                value={member.ageInput}
                onChangeText={value => handleInputChange('ageInput', value)}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.label}>Activité</Text>
              <View style={styles.pickerContainer}>
                <MaterialCommunityIcons
                  name="briefcase"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowActivityModal(true)}
                >
                  <Text style={styles.modalText}>
                    {member.activity || 'Activité'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Préférences alimentaires */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🍽️ Préférences Alimentaires</Text>
          <View style={styles.suggestionsContainer}>
            <Text style={styles.sectionSubtitle}>Suggestions populaires :</Text>
            <View style={styles.suggestions}>
              {preferencesSuggestions.map((pref, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => addPreference(pref)}
                  disabled={member.preferences.includes(pref)}
                  style={[
                    styles.suggestionButton,
                    member.preferences.includes(pref) && styles.suggestionButtonDisabled,
                  ]}
                >
                  <Text
                    style={[
                      styles.suggestionText,
                      member.preferences.includes(pref) && styles.suggestionTextDisabled,
                    ]}
                  >
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.inputContainer}>
            <View style={styles.addInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ajouter une préférence..."
                value={newPreference}
                onChangeText={setNewPreference}
                onSubmitEditing={() => addPreference(newPreference)}
              />
              <TouchableOpacity
                onPress={() => addPreference(newPreference)}
                style={styles.addIconButton}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {member.preferences.length > 0 && (
            <View>
              <Text style={styles.sectionSubtitle}>Préférences sélectionnées :</Text>
              <View style={styles.tagsContainer}>
                {member.preferences.map((pref, idx) => (
                  <View key={idx} style={styles.tag}>
                    <Text style={styles.tagText}>{pref}</Text>
                    <TouchableOpacity onPress={() => removePreference(pref)}>
                      <MaterialCommunityIcons name="close" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚠️ Allergies et Intolérances</Text>
          <View style={styles.inputContainer}>
            <View style={styles.addInputContainer}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Ex: Arachides, Gluten, Lactose..."
                value={newAllergy}
                onChangeText={setNewAllergy}
                onSubmitEditing={() => addAllergy(newAllergy)}
              />
              <TouchableOpacity
                onPress={() => addAllergy(newAllergy)}
                style={[styles.addIconButton, { backgroundColor: '#ef4444' }]}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
          {member.allergies.length > 0 && (
            <View>
              <Text style={styles.sectionSubtitle}>Allergies déclarées :</Text>
              <View style={styles.tagsContainer}>
                {member.allergies.map((allergy, idx) => (
                  <View key={idx} style={[styles.tag, styles.allergyTag]}>
                    <Text style={styles.allergyTagText}>⚠️ {allergy}</Text>
                    <TouchableOpacity onPress={() => removeAllergy(allergy)}>
                      <MaterialCommunityIcons name="close" size={14} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Boutons d'action */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSave}>
            <LinearGradient
              colors={['#f97316', '#ef4444']}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal pour sélectionner l'activité */}
      <Modal
        visible={showActivityModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActivityModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActivityModal(false)}
        >
          <View style={styles.modalContent}>
            {activityOptions.map((option, idx) => (
              <TouchableOpacity
                key={idx}
                style={[styles.modalItem, member.activity === option && styles.modalItemSelected]}
                onPress={() => {
                  handleInputChange('activity', option);
                  setShowActivityModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    member.activity === option && styles.modalItemTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal pour modification (placeholder, à implémenter dans ProfileScreen) */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowEditModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le Membre</Text>
            {/* Contenu du modal à implémenter dans ProfileScreen */}
            <TouchableOpacity
              style={[styles.saveButton, { marginTop: 16 }]}
              onPress={() => setShowEditModal(false)}
            >
              <Text style={styles.saveButtonText}>Sauvegarder</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    paddingTop: 48,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  avatarEmojiOption: {
    fontSize: 32,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  avatarOption: {
    width: 40,
    height: 40,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOptionSelected: {
    borderColor: '#f97316',
    backgroundColor: '#ffedd5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  inputIcon: {
    marginLeft: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  modalText: {
    fontSize: 16,
    color: '#1F2937',
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
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
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
  suggestionsContainer: {
    marginBottom: 16,
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionButton: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  suggestionText: {
    fontSize: 14,
    color: '#f97316',
  },
  suggestionTextDisabled: {
    color: '#6B7280',
  },
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addIconButton: {
    backgroundColor: '#f97316',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f97316',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#fff',
  },
  allergyTag: {
    backgroundColor: '#fee2e2',
  },
  allergyTagText: {
    fontSize: 14,
    color: '#ef4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default AddMemberScreen;
