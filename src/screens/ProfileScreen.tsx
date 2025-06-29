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
  Alert, // Gardé pour les messages d'erreur/succès
  Platform, // Ajouté pour la compatibilité iOS/Android si nécessaire pour le style/comportement
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { auth, db } from '../services/firebase';
import { doc, onSnapshot, updateDoc, getDoc, deleteDoc } from '@react-native-firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from '@react-native-firebase/auth'; // Nouveaux imports pour l'authentification et la suppression

// Définir les types des props
// Pour la cohérence, RootStackParamList est définie ici comme une extension de ce qui a été vu
// Assurez-vous que cette définition correspond à votre AppNavigator réel
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined; // Peut être un TabNavigator ou équivalent
  Recipes: undefined;
  Profile: undefined;
  Home: undefined;
  RecipeDetail: { recipe: any };
  AddRecipe: {};
  EditRecipe: { recipe: any };
  AddMember: { memberToEdit?: Member; memberIndex?: number }; // Ajouté car utilisé dans le code
};

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

  // Nouveaux états pour la suppression de compte
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

            // Mettre à jour Firestore si nécessaire (s'il y a des champs manquants)
            // On utilise getDoc d'abord pour éviter une boucle infinie de onSnapshot si updateDoc
            // déclenche une nouvelle snapshot alors que les données sont déjà initialisées
            const currentDoc = await getDoc(userDocRef);
            if (currentDoc.exists()) {
              const currentData = currentDoc.data() as UserData;
              let needsUpdate = false;
              const updatePayload: any = {};

              if (currentData.preferences === undefined) {
                updatePayload.preferences = preferences;
                needsUpdate = true;
              }
              if (currentData.members === undefined) {
                updatePayload.members = members;
                needsUpdate = true;
              }

              if (needsUpdate) {
                console.log('Initialisation des champs preferences et members dans Firestore.');
                try {
                  await updateDoc(userDocRef, updatePayload);
                  console.log('Champs preferences et members initialisés avec succès.');
                } catch (updateError: any) {
                  console.error('Erreur lors de l\'initialisation des champs:', updateError);
                  setError('Erreur lors de la mise à jour des données. Vérifiez votre connexion.');
                  setLoading(false);
                  return;
                }
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
    // Relance la logique useEffect en "simulant" un changement d'état important si nécessaire
    // Ou simplement, les listeners onAuthStateChanged/onSnapshot devraient se réactiver
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
    setUserData({ ...userData, preferences: updatedPreferences }); // Mise à jour optimiste

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { preferences: updatedPreferences });
        console.log('Préférences mises à jour dans Firestore.');
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour des préférences:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder les préférences. Vérifiez votre connexion.');
        setUserData({ ...userData, preferences: currentPreferences }); // Revenir en arrière en cas d'erreur
      }
    }
  };

  // Mettre à jour le budget
  const handleUpdateBudget = async () => {
    if (!userData || !newBudget) {
      Alert.alert('Erreur', 'Veuillez entrer une valeur pour le budget.');
      return;
    }

    const budgetValue = parseInt(newBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un budget valide (nombre positif).');
      return;
    }

    const oldBudget = userData.weeklyBudget;
    setUserData({ ...userData, weeklyBudget: budgetValue }); // Mise à jour optimiste
    setEditBudgetModal(false);

    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { weeklyBudget: budgetValue });
        console.log('Budget hebdomadaire mis à jour dans Firestore.');
      } catch (error: any) {
        console.error('Erreur lors de la mise à jour du budget:', error);
        Alert.alert('Erreur', 'Impossible de sauvegarder le budget. Vérifiez votre connexion.');
        setUserData({ ...userData, weeklyBudget: oldBudget }); // Revenir en arrière en cas d'erreur
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
      'Confirmation de suppression',
      'Voulez-vous vraiment supprimer ce membre de votre famille ? Cette action est irréversible.',
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
                console.log('Membre supprimé à l\'index:', memberIndex, 'dans Firestore.');
                Alert.alert('Succès', 'Membre de la famille supprimé.');
                // onSnapshot devrait mettre à jour automatiquement le userData
              } else {
                console.warn('Document utilisateur non trouvé lors de la suppression du membre.');
                Alert.alert('Erreur', 'Document utilisateur non trouvé.');
              }
            } catch (error: any) {
              console.error('Erreur lors de la suppression du membre:', error.message);
              Alert.alert('Erreur', 'Échec de la suppression du membre: ' + (error.message || 'Erreur inconnue'));
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
      Alert.alert('Déconnexion', 'Vous avez été déconnecté avec succès.');
      navigation.replace('Auth');
    } catch (error: any) {
      console.error('Erreur lors de la déconnexion:', error.message);
      Alert.alert('Erreur', error.message || 'Échec de la déconnexion.');
    }
  };

  // Gérer la modification d'un membre
  const handleEditMember = (member: Member, index: number) => {
    navigation.navigate('AddMember', { memberToEdit: member, memberIndex: index });
  };

  // Fonction pour afficher la modale de suppression de compte
  const handleDeleteAccountPress = () => {
    setDeletePassword(''); // Réinitialise le champ de mot de passe
    setDeleteError(null); // Réinitialise l'erreur
    setShowDeleteModal(true);
  };

  // Fonction de confirmation de suppression de compte
  const handleConfirmDeleteAccount = async () => {
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError('Veuillez entrer votre mot de passe pour confirmer.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté. Veuillez vous reconnecter.');
      setShowDeleteModal(false);
      navigation.replace('Auth');
      return;
    }

    try {
      // Étape 1: Réauthentifier l'utilisateur
      // C'est crucial pour les opérations sensibles comme la suppression de compte
      const credential = EmailAuthProvider.credential(user.email!, deletePassword);
      await user.reauthenticateWithCredential(credential);
      console.log('Réauthentification réussie pour la suppression du compte.');

      // Étape 2: Supprimer les données de l'utilisateur dans Firestore
      // Ceci est fait avant de supprimer l'utilisateur de l'authentification
      // car après la suppression du compte Auth, l'UID ne sera plus valide.
      const userDocRef = doc(db, 'users', user.uid);
      await deleteDoc(userDocRef);
      console.log('Données Firestore de l\'utilisateur supprimées.');

      // Étape 3: Supprimer l'utilisateur de Firebase Authentication
      await deleteUser(user); // Utiliser la fonction deleteUser
      console.log('Compte utilisateur Firebase Authentication supprimé avec succès.');

      Alert.alert('Succès', 'Votre compte a été supprimé avec toutes les données associées.');
      setShowDeleteModal(false);
      navigation.replace('Auth'); // Navigue vers l'écran d'authentification après la suppression
    } catch (error: any) {
      console.error('Erreur lors de la suppression du compte:', error);
      if (error.code === 'auth/wrong-password') {
        setDeleteError('Mot de passe incorrect. Veuillez réessayer.');
      } else if (error.code === 'auth/user-not-found') {
        setDeleteError('Utilisateur introuvable. Veuillez vous reconnecter.');
        setShowDeleteModal(false);
        navigation.replace('Auth');
      } else if (error.code === 'auth/requires-recent-login') {
        setDeleteError('Cette opération est sensible et nécessite une réauthentification récente. Veuillez vous déconnecter, vous reconnecter, puis réessayez la suppression.');
        setShowDeleteModal(false); // Ferme la modale, suggère de se reconnecter
        auth.signOut(); // Force la déconnexion pour obliger la réauthentification
        navigation.replace('Auth');
      } else {
        setDeleteError('Erreur lors de la suppression du compte: ' + (error.message || 'Erreur inconnue'));
      }
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
          <Text>
            <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
          </Text>
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
          <Text>
            <MaterialCommunityIcons name="arrow-left" size={20} color="#374151" />
          </Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon Profil</Text>
        <View style={styles.headerIcons}>
          <Text>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
          </Text>
          <View style={styles.userIcon}>
            <Text>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentPadding}>
          {/* Profil utilisateur */}
          <View style={styles.section}>
            <View style={styles.userProfile}>
              <View style={styles.avatarContainer}>
                <Text>
                  <MaterialCommunityIcons name="account" size={32} color="#fff" />
                </Text>
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
              <Text>
                <MaterialCommunityIcons name="plus" size={16} color="#6B7280" />
              </Text>
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
                <View // Revert from Animated.View to View
                  style={[
                    styles.toggleSwitchContainer,
                    userData.preferences &&
                      userData.preferences[key as keyof UserData['preferences']] &&
                      styles.toggleActive,
                  ]}
                >
                  <View // Revert from Animated.View to View
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

          {/* Bouton de suppression de compte */}
          <TouchableOpacity style={styles.deleteAccountButton} onPress={handleDeleteAccountPress}>
            <Text style={styles.deleteAccountButtonText}>Supprimer mon compte</Text>
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
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditBudgetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButtonPrimary} onPress={handleUpdateBudget}>
                <Text style={styles.actionButtonPrimaryText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modale pour la suppression de compte */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Supprimer le compte</Text>
            <Text style={styles.modalMessage}>
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et
              supprimera toutes vos données. Veuillez confirmer votre mot de passe.
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
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDeleteModal(false)}
              >
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
    paddingTop: Platform.OS === 'ios' ? 48 : 24, // Ajustement pour iOS statusBar
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
  // Renommé pour éviter le conflit avec le toggleContainer global du AuthScreen
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
    marginBottom: 16, // Espacement avant le bouton de suppression
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ef4444',
  },
  // Styles pour la suppression de compte
  deleteAccountButton: {
    backgroundColor: '#dc2626', // Rouge vif pour une action destructive
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 32, // Espacement en bas de la page
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
    padding: 20, // Légèrement plus de padding
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000', // Ombres pour la modale
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
    textAlign: 'center', // Centrer le titre de la modale
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
    backgroundColor: '#F9FAFB', // Fond légèrement gris pour l'input
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
  // Bouton général pour les actions primaires (Enregistrer, etc.)
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
  // Bouton spécifique pour la confirmation de suppression
  deleteConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444', // Rouge vif pour confirmer la suppression
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
