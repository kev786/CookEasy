/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Platform,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth, db } from '../services/firebase'; // Importer directement auth et db
import { doc, setDoc } from '@react-native-firebase/firestore';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined; // Ajouté pour correspondre à AppNavigator
  Recipes: undefined;
  Profile: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  familySize: string;
  weeklyBudget: string;
}

const AuthScreen: React.FC<Props> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showFamilySizeModal, setShowFamilySizeModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    familySize: '3',
    weeklyBudget: '150',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, translateYAnim]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    if (!formData.email.includes('@') || formData.email.length < 5) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide.');
      return false;
    }
    if (formData.password.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit contenir au moins 6 caractères.');
      return false;
    }
    if (!isLogin) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        Alert.alert('Erreur', 'Veuillez entrer votre prénom et nom.');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
        return false;
      }
      if (formData.phone && !formData.phone.match(/^\+?\d{9,14}$/)) {
        Alert.alert('Erreur', 'Veuillez entrer un numéro de téléphone valide.');
        return false;
      }
      if (!formData.weeklyBudget || parseInt(formData.weeklyBudget, 10) <= 0) {
        Alert.alert('Erreur', 'Veuillez entrer un budget hebdomadaire valide.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {return;}

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      if (isLogin) {
        console.log('Tentative de connexion avec:', formData.email);
        await auth.signInWithEmailAndPassword(formData.email, formData.password);
        console.log('Connexion réussie');
        Alert.alert('Succès', 'Connexion réussie !');
        navigation.replace('Main'); // Redirige vers Main (premier onglet: Home)
      } else {
        console.log('Tentative de création de compte avec:', formData.email);
        const userCredential = await auth.createUserWithEmailAndPassword(
          formData.email,
          formData.password
        );
        const user = userCredential.user;
        if (user) {
          console.log('Utilisateur créé:', user.uid);
          try {
            await user.updateProfile({
              displayName: `${formData.firstName} ${formData.lastName}`,
            });
            console.log('Profil mis à jour avec succès');
          } catch (profileError: any) {
            console.error('Erreur lors de la mise à jour du profil:', profileError.message);
            Alert.alert('Avertissement', 'Compte créé, mais échec de la mise à jour du profil.');
          }

          try {
            await setDoc(doc(db, 'users', user.uid), {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone || '',
              familySize: parseInt(formData.familySize, 10),
              weeklyBudget: parseInt(formData.weeklyBudget, 10),
              createdAt: new Date(),
            });
            console.log('Données utilisateur enregistrées dans Firestore');
          } catch (firestoreError: any) {
            console.error('Erreur lors de l\'enregistrement dans Firestore:', firestoreError.message);
            Alert.alert(
              'Erreur',
              'Compte créé, mais échec de l\'enregistrement des données. Vérifiez les permissions Firestore.'
            );
            return;
          }

          console.log('Inscription terminée, navigation vers Main');
          Alert.alert('Succès', 'Inscription réussie !');
          navigation.replace('Main'); // Redirige vers Main (premier onglet: Home)
        } else {
          console.error('Aucun utilisateur retourné après création');
          Alert.alert('Erreur', 'Échec de la création du compte: utilisateur non trouvé.');
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'authentification:', error.message);
      Alert.alert('Erreur', error.message || 'Échec de l’authentification.');
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email.includes('@') || formData.email.length < 5) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide.');
      return;
    }
    try {
      await auth.sendPasswordResetEmail(formData.email);
      Alert.alert('Succès', 'Un email de réinitialisation a été envoyé.');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi de l\'email de réinitialisation:', error.message);
      Alert.alert('Erreur', error.message || 'Échec de l’envoi de l’email.');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Connexion Google', 'Cette fonctionnalité sera implémentée bientôt.');
  };

  const familySizeOptions = [
    { value: '1', label: '1 personne' },
    { value: '2', label: '2 personnes' },
    { value: '3', label: '3 personnes' },
    { value: '4', label: '4 personnes' },
    { value: '5', label: '5+ personnes' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <MaterialCommunityIcons name="chef-hat" size={40} color="#fff" />
            </View>
            <Text style={styles.appName}>CuisineAI</Text>
            <Text style={styles.slogan}>Votre assistant culinaire intelligent</Text>
          </View>
        </LinearGradient>

        {/* Carte blanche */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ translateY: translateYAnim }],
              marginTop: -15,
              alignSelf: 'center',
              width: '92%',
              maxWidth: 448,
            },
          ]}
        >
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, isLogin && styles.activeToggle]}
              onPress={() => setIsLogin(true)}
            >
              <Text style={[styles.toggleText, isLogin && styles.activeToggleText]}>
                Connexion
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !isLogin && styles.activeToggle]}
              onPress={() => setIsLogin(false)}
            >
              <Text style={[styles.toggleText, !isLogin && styles.activeToggleText]}>
                Inscription
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Prénom</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Prénom"
                      placeholderTextColor="#9CA3AF"
                      value={formData.firstName}
                      onChangeText={value => handleInputChange('firstName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Nom</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="account"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="Nom"
                      placeholderTextColor="#9CA3AF"
                      value={formData.lastName}
                      onChangeText={value => handleInputChange('lastName', value)}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>
            )}

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Téléphone</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="phone"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="+33 6 12 34 56 78"
                    placeholderTextColor="#9CA3AF"
                    value={formData.phone}
                    onChangeText={value => handleInputChange('phone', value)}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="email"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="votre@email.com"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={value => handleInputChange('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.inputWrapper}>
                <MaterialCommunityIcons
                  name="lock"
                  size={20}
                  color="#9CA3AF"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={value => handleInputChange('password', value)}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <MaterialCommunityIcons
                    name={showPassword ? 'eye-off' : 'eye'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {!isLogin && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirmer le mot de passe</Text>
                <View style={styles.inputWrapper}>
                  <MaterialCommunityIcons
                    name="lock"
                    size={20}
                    color="#9CA3AF"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={formData.confirmPassword}
                    onChangeText={value => handleInputChange('confirmPassword', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            )}

            {!isLogin && (
              <View style={styles.row}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Taille famille</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="account-group"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TouchableOpacity
                      style={styles.modalButton}
                      onPress={() => setShowFamilySizeModal(true)}
                    >
                      <Text style={styles.modalText}>
                        {familySizeOptions.find(opt => opt.value === formData.familySize)?.label}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.label}>Budget/semaine</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialCommunityIcons
                      name="currency-eur"
                      size={20}
                      color="#9CA3AF"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="150"
                      placeholderTextColor="#9CA3AF"
                      value={formData.weeklyBudget}
                      onChangeText={value => handleInputChange('weeklyBudget', value)}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>
            )}

            {isLogin && (
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity
                onPress={handleSubmit}
                onPressIn={() =>
                  Animated.timing(scaleAnim, {
                    toValue: 1.02,
                    duration: 100,
                    useNativeDriver: true,
                  }).start()
                }
                onPressOut={() =>
                  Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                  }).start()
                }
              >
                <LinearGradient colors={['#f97316', '#ef4444']} style={styles.submitButton}>
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Se connecter' : 'Créer mon compte'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <View style={styles.googleIcon}>
              <Text style={styles.googleIconText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>Continuer avec Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Avantages */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>🎯 Pourquoi CuisineAI ?</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: '#FEE2E2' }]}>
                <Text>🤖</Text>
              </View>
              <Text style={styles.benefitText}>IA personnalisée selon votre famille</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: '#D1FAE5' }]}>
                <Text>💰</Text>
              </View>
              <Text style={styles.benefitText}>Économisez jusqu'à 30% sur vos courses</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: '#DBEAFE' }]}>
                <Text>📱</Text>
              </View>
              <Text style={styles.benefitText}>Interface simple et intuitive</Text>
            </View>
            <View style={styles.benefitItem}>
              <View style={[styles.benefitIcon, { backgroundColor: '#EDE9FE' }]}>
                <Text>🍽️</Text>
              </View>
              <Text style={styles.benefitText}>Recettes adaptées à vos goûts</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal pour la taille de famille */}
      <Modal visible={showFamilySizeModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFamilySizeModal(false)}
        >
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: translateYAnim.interpolate({
                      inputRange: [0, 20],
                      outputRange: [0, 10],
                    }),
                  },
                ],
              },
            ]}
          >
            {familySizeOptions.map(option => (
              <TouchableOpacity
                key={option.value}
                style={[styles.modalItem, formData.familySize === option.value && styles.modalItemSelected]}
                onPress={() => {
                  handleInputChange('familySize', option.value);
                  setShowFamilySizeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalItemText,
                    formData.familySize === option.value && styles.modalItemTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    maxWidth: 448,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 48,
    paddingBottom: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollContainer: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeToggle: {
    backgroundColor: '#f97316',
  },
  toggleText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '600',
  },
  activeToggleText: {
    color: '#fff',
  },
  form: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
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
  inputWrapper: {
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
  modalText: {
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 12,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#f97316',
    textAlign: 'right',
    marginBottom: 16,
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6B7280',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: 12,
  },
  googleIcon: {
    width: 20,
    height: 20,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  googleButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  benefitsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '92%',
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    marginTop: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
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

export default AuthScreen;
