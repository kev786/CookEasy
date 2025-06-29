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
  Platform,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, getDoc, deleteDoc } from '@react-native-firebase/firestore';
import { EmailAuthProvider, deleteUser } from '@react-native-firebase/auth';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
  Recipes: undefined;
  Profile: undefined;
  Home: undefined;
  RecipeDetail: { recipe: any };
  AddRecipe: {};
  EditRecipe: { recipe: any };
  AddMember: { memberToEdit?: Member; memberIndex?: number };
};

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  familySize: number;
  weeklyBudget?: number; // Rendre weeklyBudget optionnel pour gérer les cas où il est absent
  preferences?: { vegetarian?: boolean; glutenFree?: boolean; organic?: boolean };
  members?: Member[];
}

export interface Member {
  name: string;
  age: number;
  activity: string;
  preferences: string[];
  allergies?: string[];
  avatar?: string;
}

type PreferenceKey = 'vegetarian' | 'glutenFree' | 'organic';

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editBudgetModal, setEditBudgetModal] = useState(false);
  const [newBudget, setNewBudget] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        console.log('Aucun utilisateur connecté, redirection vers Auth');
        Alert.alert('Erreur', 'Utilisateur non connecté.');
        navigation.replace('Auth');
        return;
      }

      console.log('Utilisateur connecté:', user.uid);
      const userDocRef = doc(db, 'users', user.uid);

      const unsubscribeFirestore = onSnapshot(
        userDocRef,
        (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            console.log('Données reçues de Firestore:', data);

            const preferences = data.preferences || {
              vegetarian: false,
              glutenFree: false,
              organic: false,
            };
            const members = data.members || [];

            // Vérifier et définir un budget par défaut si absent
            const weeklyBudget = data.weeklyBudget || 0;
            setNewBudget(weeklyBudget.toString());

            setUserData({ ...data, preferences, members, weeklyBudget });
            setError(null);
            setLoading(false);
          } else {
            console.log('Aucun document trouvé pour UID:', user.uid);
            setError('Données utilisateur non trouvées.');
            setLoading(false);
          }
        },
        (snapshotError) => {
          console.error('Erreur Firestore:', snapshotError);
          setError('Impossible de charger les données: ' + (snapshotError.message || 'Erreur inconnue'));
          setLoading(false);
        }
      );

      return () => unsubscribeFirestore();
    });

    return () => unsubscribeAuth();
  }, [navigation]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    console.log('Retentative de chargement...');
  };

  const togglePreference = async (key: PreferenceKey) => {
    if (!userData) {return;}

    const currentPreferences = userData.preferences || {
      vegetarian: false,
      glutenFree: false,
      organic: false,
    };
    const updatedPreferences = { ...currentPreferences, [key]: !currentPreferences[key] };
    setUserData({ ...userData, preferences: updatedPreferences });

    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { preferences: updatedPreferences });
        console.log('Préférences mises à jour.');
      } catch (error: any) {
        console.error('Erreur mise à jour préférences:', error);
        Alert.alert('Erreur', 'Échec mise à jour préférences.');
        setUserData({ ...userData, preferences: currentPreferences });
      }
    }
  };

  const handleUpdateBudget = async () => {
    if (!userData || !newBudget) {
      Alert.alert('Erreur', 'Entrez un budget valide.');
      return;
    }

    const budgetValue = parseInt(newBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Erreur', 'Budget invalide.');
      return;
    }

    const oldBudget = userData.weeklyBudget || 0;
    setUserData({ ...userData, weeklyBudget: budgetValue });
    setEditBudgetModal(false);

    const user = auth.currentUser;
    if (user) {
      try {
        await updateDoc(doc(db, 'users', user.uid), { weeklyBudget: budgetValue });
        console.log('Budget mis à jour.');
      } catch (error: any) {
        console.error('Erreur mise à jour budget:', error);
        Alert.alert('Erreur', 'Échec mise à jour budget.');
        setUserData({ ...userData, weeklyBudget: oldBudget });
      }
    }
  };

  const handleDeleteMember = async (memberIndex: number) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      return;
    }

    Alert.alert(
      'Confirmation',
      'Supprimer ce membre ? Action irréversible.',
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
                const updatedMembers = (data.members || []).filter((_, idx) => idx !== memberIndex);
                await updateDoc(userDocRef, { members: updatedMembers });
                console.log('Membre supprimé.');
                Alert.alert('Succès', 'Membre supprimé.');
              }
            } catch (error: any) {
              console.error('Erreur suppression membre:', error.message);
              Alert.alert('Erreur', 'Échec suppression membre.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      Alert.alert('Déconnexion', 'Succès.');
      navigation.replace('Auth');
    } catch (error: any) {
      console.error('Erreur déconnexion:', error.message);
      Alert.alert('Erreur', 'Échec déconnexion.');
    }
  };

  const handleEditMember = (member: Member, index: number) => {
    navigation.navigate('AddMember', { memberToEdit: member, memberIndex: index });
  };

  const handleDeleteAccountPress = () => {
    setDeletePassword('');
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDeleteAccount = async () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError('Entrez votre mot de passe.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté.');
      setShowDeleteModal(false);
      navigation.replace('Auth');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email!, deletePassword);
      await user.reauthenticateWithCredential(credential);
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      await deleteUser(user);
      Alert.alert('Succès', 'Compte supprimé.');
      setShowDeleteModal(false);
      navigation.replace('Auth');
    } catch (error: any) {
      console.error('Erreur suppression compte:', error);
      if (error.code === 'auth/wrong-password') {setDeleteError('Mot de passe incorrect.');}
      else if (error.code === 'auth/user-not-found') {
        setDeleteError('Utilisateur introuvable.');
        setShowDeleteModal(false);
        navigation.replace('Auth');
      } else if (error.code === 'auth/requires-recent-login') {
        setDeleteError('Réauthentification requise.');
        setShowDeleteModal(false);
        auth.signOut();
        navigation.replace('Auth');
      } else {setDeleteError('Échec suppression: ' + error.message);}
    }
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

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👨‍👩‍👧 Ma Famille</Text>
            </View>
            <View style={styles.membersList}>
              {userData.members && userData.members.length > 0 ? (
                userData.members.map((member, idx) => (
                  <TouchableOpacity key={idx} onLongPress={() => handleDeleteMember(idx)} style={styles.memberItem}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberAvatar}>{member.avatar || '👤'}</Text>
                      <View>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberDetails}>{member.age} ans • {member.activity || 'Non spécifié'}</Text>
                      </View>
                    </View>
                    <View style={styles.memberActions}>
                      <TouchableOpacity onPress={() => handleEditMember(member, idx)} style={styles.memberEditButton}>
                        <Text style={styles.memberEditButtonText}>Modifier</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.preferencesContainer}>
                      {member.preferences.map((pref, pidx) => (
                        <Text key={pidx} style={styles.preferenceTag}>{pref}</Text>
                      ))}
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noMembersText}>Aucun membre ajouté.</Text>
              )}
            </View>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddMember', {})}>
              <MaterialCommunityIcons name="plus" size={16} color="#6B7280" />
              <Text style={styles.addButtonText}>Ajouter un membre</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🍽️ Préférences Alimentaires</Text>
            {([
              { label: 'Régime végétarien', key: 'vegetarian' },
              { label: 'Sans gluten', key: 'glutenFree' },
              { label: 'Bio uniquement', key: 'organic' },
            ] as { label: string; key: PreferenceKey }[]).map(({ label, key }) => (
              <TouchableOpacity key={key} style={styles.preferenceItem} onPress={() => togglePreference(key)}>
                <Text style={styles.preferenceLabel}>{label}</Text>
                <View style={[styles.toggleSwitchContainer, userData.preferences?.[key] && styles.toggleActive]}>
                  <View style={[styles.toggleCircle, userData.preferences?.[key] && styles.toggleCircleActive]} />
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Budget Courses</Text>
            <View style={styles.budgetContainer}>
              <View style={styles.budgetRow}>
                <Text style={styles.budgetLabel}>Budget hebdomadaire</Text>
                <Text style={styles.budgetValue}>
                  {(userData.weeklyBudget || 0).toString()}FCFA / {(userData.weeklyBudget || 0).toString()}FCFA
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

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Se déconnecter</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccountPress}>
            <Text style={styles.deleteAccountButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={editBudgetModal} animationType="slide" transparent={true} onRequestClose={() => setEditBudgetModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Modifier le budget</Text>
            <TextInput
              style={styles.input}
              placeholder="Nouveau budget (FCFA)"
              keyboardType="numeric"
              value={newBudget}
              onChangeText={setNewBudget}
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditBudgetModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleUpdateBudget}>
                <Text style={styles.actionButtonPrimaryText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showDeleteModal} animationType="fade" transparent={true} onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer le compte</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera toutes vos données. Veuillez confirmer votre mot de passe.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Votre mot de passe"
              secureTextEntry={true}
              value={deletePassword}
              onChangeText={setDeletePassword}
              placeholderTextColor="#9CA3AF"
            />
            {deleteError && <Text style={styles.deleteErrorMessage}>{deleteError}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowDeleteModal(false)}>
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={handleConfirmDeleteAccount}>
                <Text style={styles.deleteConfirmButtonText}>Supprimer définitivement</Text>
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
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
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
  toggleSwitchContainer: {
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
    marginBottom: 16,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
  deleteAccountButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    justifyContent: 'center',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4B5563',
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  deleteErrorMessage: {
    color: '#ef4444',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default ProfileScreen;
