/* eslint-disable no-catch-shadow */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable radix */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, getDoc } from '@react-native-firebase/firestore';

// Définir les types des props
type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

// Interface pour les données utilisateur
interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  familySize: number;
  weeklyBudget: number;
  preferences?: { vegetarian?: boolean; glutenFree?: boolean; organic?: boolean };
  members?: Member[];
}

// Interface pour un membre de la famille
export interface Member {
  name: string;
  age: number;
  activity: string;
  preferences: string[];
  allergies?: string[];
  avatar?: string;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editBudgetModal, setEditBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState<string>('');

  // Vérifier l'état de l'utilisateur et récupérer les données
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log('Aucun utilisateur connecté, redirection vers Auth');
        Alert.alert('Erreur', 'Utilisateur non connecté.');
        navigation.replace('Auth');
        return;
      }

      console.log('Utilisateur connecté:', user.uid);

      const userDocRef = doc(db, 'users', user.uid);

      // Écoute des données en temps réel avec onSnapshot
      const unsubscribeFirestore = onSnapshot(
        userDocRef,
        async (userDoc) => {
          console.log('Écoute des données pour UID:', user.uid);
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            console.log('Document brut:', data);

            // Initialiser preferences et members s'ils sont absents
            const preferences = data.preferences || {
              vegetarian: false,
              glutenFree: false,
              organic: false,
            };
            const members = data.members || [];

            // Mettre à jour Firestore si nécessaire
            if (!data.preferences || !data.members) {
              console.log('Initialisation des champs preferences et members dans Firestore');
              try {
                await updateDoc(userDocRef, {
                  preferences: preferences,
                  members: members,
                });
              } catch (updateError: any) {
                console.error('Erreur lors de l\'initialisation des champs:', updateError);
                setError('Erreur lors de la mise à jour des données. Vérifiez votre connexion.');
                setLoading(false);
                return;
              }
            }

            const updatedUserData = { ...data, preferences, members };
            setUserData(updatedUserData);
            setNewBudget(data.weeklyBudget.toString());
            setError(null);
            console.log('Données chargées avec succès:', updatedUserData);
          } else {
            console.log('Aucun document trouvé pour UID:', user.uid);
            setError('Données utilisateur non trouvées. Veuillez réessayer l\'inscription.');
          }
          setLoading(false);
        },
        (error) => {
          console.error('Erreur Firestore avec onSnapshot:', error);
          const err = error as { code?: string; message?: string };
          if (err.code === 'firestore/unavailable') {
            setError(
              'Service temporairement indisponible. Les données locales ont été utilisées si disponibles.'
            );
          } else if (err.code === 'firestore/permission-denied') {
            setError('Accès refusé. Vérifiez vos permissions Firestore.');
          } else {
            setError('Impossible de charger les données: ' + (err.message || 'Erreur inconnue'));
          }
          setLoading(false);
        }
      );

      // Nettoyer l'écouteur Firestore lors du démontage
      return () => unsubscribeFirestore();
    });

    // Nettoyer l'écouteur Auth lors du démontage
    return () => unsubscribeAuth();
  }, [navigation]);

  // Fonction pour retenter le chargement des données
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    console.log('Retenter la connexion...');
  };

  // Gérer les préférences alimentaires
  const togglePreference = async (key: keyof NonNullable<UserData['preferences']>) => {
    if (!userData) {
      return;
    }

    const currentPreferences = userData.preferences || {
      vegetarian: false,
      glutenFree: false,
      organic: false,
    };
    const updatedPreferences = {
      ...currentPreferences,
      [key]: !currentPreferences[key],
    };
    setUserData({ ...userData, preferences: updatedPreferences });

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { preferences: updatedPreferences });
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder les préférences. Vérifiez votre connexion.');
        setUserData({ ...userData, preferences: currentPreferences });
      }
    }
  };

  // Mettre à jour le budget
  const handleUpdateBudget = async () => {
    if (!userData || !newBudget) {
      return;
    }

    const budgetValue = parseInt(newBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un budget valide.');
      return;
    }

    const oldBudget = userData.weeklyBudget;
    setUserData({ ...userData, weeklyBudget: budgetValue });
    setEditBudgetModal(false);

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { weeklyBudget: budgetValue });
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du budget:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder le budget. Vérifiez votre connexion.');
        setUserData({ ...userData, weeklyBudget: oldBudget });
      }
    }
  };

  // Gérer la suppression d'un membre
  const handleDeleteMember = async (memberIndex: number) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce membre ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const userDocRef = doc(db, 'users', user.uid);
              const snapshot = await getDoc(userDocRef);
              if (snapshot.exists()) {
                const data = snapshot.data() as UserData;
                const existingMembers = data?.members || [];
                const updatedMembers = existingMembers.filter(
                  (_: Member, idx: number) => idx !== memberIndex
                );
                await updateDoc(userDocRef, { members: updatedMembers });
                console.log('Membre supprimé à l\'index:', memberIndex);
                // Mise à jour locale pour éviter un décalage
                setUserData((prev) => prev ? { ...prev, members: updatedMembers } : null);
              }
            } catch (error: any) {
              console.error('Erreur lors de la suppression:', error.message);
              Alert.alert('Erreur', 'Échec de la suppression: ' + (error.message || 'Erreur inconnue'));
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Gérer la déconnexion
  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Auth');
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Échec de la déconnexion.');
    }
  };

  // Gérer la modification d'un membre
  const handleEditMember = (member: Member, index: number) => {
    navigation.navigate('AddMember', { memberToEdit: member, memberIndex: index });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="loading" size={48} color="#f97316" />
        <Text style={styles.loadingText}>Chargement des données...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={styles.headerIcons}>
          <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
          <View style={styles.userIcon}>
            <MaterialCommunityIcons name="account" size={20} color="#fff" />
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Profil utilisateur */}
          <View style={styles.section}>
            <View style={styles.userProfile}>
              <View style={styles.avatarContainer}>
                <MaterialCommunityIcons name="account" size={32} color="#fff" />
              </View>
              <View>
                <Text style={styles.userName}>{`${userData.firstName} ${userData.lastName}`}</Text>
                <Text style={styles.userEmail}>{userData.email}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Text style={styles.editButtonText}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>

          {/* Gestion famille */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👨‍👩‍👧 Ma Famille</Text>
            </View>
            <View style={styles.membersList}>
              {userData.members && userData.members.length > 0 ? (
                userData.members.map((member, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onLongPress={() => handleDeleteMember(idx)}
                    style={styles.memberItem}
                  >
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberAvatar}>{member.avatar || '👤'}</Text>
                      <View>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberDetails}>
                          {member.age} ans • {member.activity || 'Non spécifié'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      <TouchableOpacity
                        onPress={() => handleEditMember(member, idx)}
                        style={styles.memberEditButton}
                      >
                        <Text style={styles.memberEditButtonText}>Modifier</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.preferencesContainer}>
                      {member.preferences.map((pref, pidx) => (
                        <Text key={pidx} style={styles.preferenceTag}>
                          {pref}
                        </Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noMembersText}>Aucun membre ajouté.</Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('AddMember')}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#6B7280" />
              <Text style={styles.addButtonText}>Ajouter un membre</Text>
            </TouchableOpacity>
          </View>

          {/* Préférences alimentaires */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Préférences Alimentaires</Text>
            {[
              { label: 'Régime végétarien', key: 'vegetarian' },
              { label: 'Sans gluten', key: 'glutenFree' },
              { label: 'Bio uniquement', key: 'organic' },
            ].map(({ label, key }) => (
              <TouchableOpacity
                key={key}
                style={styles.preferenceItem}
                onPress={() => togglePreference(key as keyof NonNullable<UserData['preferences']>)}
              >
                <Text style={styles.preferenceLabel}>{label}</Text>
                <View
                  style={[
                    styles.toggleContainer,
                    userData.preferences &&
                      userData.preferences[key as keyof UserData['preferences']] &&
                      styles.toggleActive,
                  ]}
                >
                  <View
                    style={[
                      styles.toggleCircle,
                      userData.preferences &&
                        userData.preferences[key as keyof UserData['preferences']] &&
                        styles.toggleCircleActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Budget */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Budget Courses</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Budget hebdomadaire</Text>
                <Text style={styles.budgetValue}>
                  {userData.weeklyBudget}€ / {userData.weeklyBudget}FCFA
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View style={styles.progressFill} />
              </View>
            </View>
            <TouchableOpacity onPress={() => setEditBudgetModal(true)}>
              <Text style={styles.actionText}>Modifier le budget</Text>
            </TouchableOpacity>
          </View>

          {/* Déconnexion */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modale pour modifier le budget */}
      <Modal
        visible={editBudgetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le budget</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouveau budget (FCFA)"
              keyboardType="numeric"
              value={newBudget}
              onChangeText={setNewBudget}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditBudgetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMemberButton} onPress={handleUpdateBudget}>
                <Text style={styles.addMemberButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerContainer: {
    backgroundColor: '#f97316',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 16,
    paddingBottom: 100,
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
  userProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    backgroundColor: '#f97316',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    backgroundColor: '#ffedd5',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#f97316',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f97316',
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    fontSize: 24,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  memberDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  memberActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  memberEditButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  memberEditButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  preferencesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  preferenceTag: {
    backgroundColor: '#ffedd5',
    color: '#f97316',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
  },
  noMembersText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  addButton: {
    marginTop: 16,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  toggleContainer: {
    width: 48,
    height: 24,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    padding: 2,
  },
  toggleActive: {
    backgroundColor: '#f97316',
  },
  toggleCircle: {
    width: 20,
    height: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleCircleActive: {
    marginLeft: 24,
  },
  budgetContainer: {
    marginVertical: 16,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  budgetLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  budgetValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressFill: {
    width: '100%',
    height: 8,
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
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
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  addMemberButton: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addMemberButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
});

export default ProfileScreen;
