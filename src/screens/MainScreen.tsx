import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { auth } from '../services/firebase'; // Importer depuis firebase.ts

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

const MainScreen: React.FC<Props> = ({ navigation }) => {
  const [userName, setUserName] = useState<string>('Utilisateur');

  useEffect(() => {
    const user = auth.currentUser;
    if (user && user.displayName) {
      setUserName(user.displayName.split(' ')[0]); // Prend le prénom
    }
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigation.replace('Auth');
    } catch (error: any) {
      console.error('Erreur de déconnexion :', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Bienvenue sur CuisineAI, {userName} !</Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 20,
  },
  logoutButton: {
    backgroundColor: '#f97316',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default MainScreen;
