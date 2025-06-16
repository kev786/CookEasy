/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

// Types pour la navigation
export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  Main: undefined;
};
type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current; // Fade-in pour le texte
  const pulseAnim = useRef(new Animated.Value(1)).current; // Pulse pour le logo
  const spinAnim = useRef(new Animated.Value(0)).current; // Spin pour l'étoile
  const circle1Anim = useRef(new Animated.Value(0)).current; // Cercles animés
  const circle2Anim = useRef(new Animated.Value(0)).current;
  const circle3Anim = useRef(new Animated.Value(0)).current;
  const circle4Anim = useRef(new Animated.Value(0)).current;
  const emoji1Anim = useRef(new Animated.Value(0)).current; // Emojis animés
  const emoji2Anim = useRef(new Animated.Value(0)).current;
  const emoji3Anim = useRef(new Animated.Value(0)).current;
  const emoji4Anim = useRef(new Animated.Value(0)).current;
  const spinnerAnim = useRef(new Animated.Value(0)).current; // Spinner rotation
  const spinnerPulseAnim = useRef(new Animated.Value(1)).current; // Spinner pulsation

  // Particules animées (corrigé pour respecter les règles des hooks)
  const particleRefs = [
    useRef(new Animated.Value(0)),
    useRef(new Animated.Value(0)),
    useRef(new Animated.Value(0)),
    useRef(new Animated.Value(0)),
    useRef(new Animated.Value(0)),
    useRef(new Animated.Value(0)),
  ];
  const particleAnims = particleRefs.map(ref => ref.current); // Particules

  useEffect(() => {
    // Animations parallèles
    Animated.parallel([
      // Fade-in pour le titre
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      // Pulse pour le logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
      // Spin pour l'étoile
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ),
      // Cercles animés
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle1Anim, {
            toValue: 10,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(circle1Anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle2Anim, {
            toValue: 20,
            duration: 1000,
            delay: 500,
            useNativeDriver: true,
          }),
          Animated.timing(circle2Anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle3Anim, {
            toValue: 10,
            duration: 1000,
            delay: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(circle3Anim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(circle4Anim, {
            toValue: 10,
            duration: 1000,
            delay: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(circle4Anim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ),
      // Emojis animés
      Animated.loop(
        Animated.sequence([
          Animated.timing(emoji1Anim, {
            toValue: 10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(emoji1Anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(emoji2Anim, {
            toValue: 10,
            duration: 500,
            delay: 200,
            useNativeDriver: true,
          }),
          Animated.timing(emoji2Anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(emoji3Anim, {
            toValue: 10,
            duration: 500,
            delay: 400,
            useNativeDriver: true,
          }),
          Animated.timing(emoji3Anim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(emoji4Anim, {
            toValue: 10,
            duration: 500,
            delay: 600,
            useNativeDriver: true,
          }),
          Animated.timing(emoji4Anim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ),
      // Spinner rotation (CORRIGÉ)
      Animated.loop(
        Animated.timing(spinnerAnim, {
          toValue: 1,
          duration: 1000, // Plus lent pour une meilleure visibilité
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ),
      // Spinner pulsation (optionnel - ajouté pour plus d'effet)
      Animated.loop(
        Animated.sequence([
          Animated.timing(spinnerPulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(spinnerPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ),
      // Particules flottantes
      ...particleAnims.map((anim, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: -20,
              duration: 3000 + i * 500,
              delay: i * 500,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 3000 + i * 500,
              useNativeDriver: true,
            }),
          ])
        )
      ),
    ]).start();

    // Navigation vers Auth après 3 secondes
    const timer = setTimeout(() => {
      navigation.replace('Auth');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigation, fadeAnim, pulseAnim, spinAnim, circle1Anim, circle2Anim, circle3Anim, circle4Anim, emoji1Anim, emoji2Anim, emoji3Anim, emoji4Anim, spinnerAnim, spinnerPulseAnim, particleAnims]);

  return (
    <LinearGradient
      colors={['#fb923c', '#ef4444', '#ec4899']} // orange-400, red-500, pink-500
      style={styles.container}
    >
      {/* Cercles animés */}
      <Animated.View
        style={[styles.circle, { top: 40, left: 40, width: 80, height: 80, transform: [{ translateY: circle1Anim }] }]}
      />
      <Animated.View
        style={[styles.circle, { top: 128, right: 64, width: 64, height: 64, transform: [{ translateY: circle2Anim }] }]}
      />
      <Animated.View
        style={[styles.circle, { bottom: 128, left: 80, width: 48, height: 48, transform: [{ translateY: circle3Anim }] }]}
      />
      <Animated.View
        style={[styles.circle, { bottom: 80, right: 128, width: 96, height: 96, transform: [{ translateY: circle4Anim }] }]}
      />

      {/* Contenu principal */}
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoCircle, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialCommunityIcons name="chef-hat" size={64} color="#fff" />
          </Animated.View>
          <Animated.View
            style={[styles.star, { transform: [{ rotate: spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }] }]}
          >
            <Text style={styles.starText}>✨</Text>
          </Animated.View>
        </View>

        {/* Titre */}
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>CuisineAI</Animated.Text>
        <Animated.Text
          style={[styles.subtitle, { opacity: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
        >
          Smart Family Cooking
        </Animated.Text>

        {/* Emojis animés */}
        <View style={styles.emojiContainer}>
          <Animated.Text style={[styles.emoji, { transform: [{ translateY: emoji1Anim }] }]}>🍳</Animated.Text>
          <Animated.Text style={[styles.emoji, { transform: [{ translateY: emoji2Anim }] }]}>🥘</Animated.Text>
          <Animated.Text style={[styles.emoji, { transform: [{ translateY: emoji3Anim }] }]}>🍽️</Animated.Text>
          <Animated.Text style={[styles.emoji, { transform: [{ translateY: emoji4Anim }] }]}>👨‍👩‍👧‍👦</Animated.Text>
        </View>

        {/* Spinner animé - Alternative avec icône */}
        <Animated.View
          style={[
            styles.spinnerIconContainer,
            {
              transform: [
                { rotate: spinnerAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
                { scale: spinnerPulseAnim },
              ],
            },
          ]}
        >
          <MaterialCommunityIcons name="loading" size={32} color="#ffffff" />
        </Animated.View>

        {/* Texte de chargement */}
        <Text style={styles.loadingText}>Chargement de votre expérience culinaire...</Text>
      </View>

      {/* Particules flottantes */}
      {['🍎', '🥕', '🍞', '🧀', '🥩', '🥬'].map((emoji, i) => (
        <Animated.Text
          key={i}
          style={[
            styles.particle,
            {
              left: `${10 + i * 15}%`,
              top: `${20 + i * 10}%`,
              transform: [
                { translateY: particleAnims[i] },
                { rotate: particleAnims[i].interpolate({ inputRange: [-20, 0], outputRange: ['180deg', '0deg'] }) },
              ],
            },
          ]}
        >
          {emoji}
        </Animated.Text>
      ))}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 999,
  },
  content: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  logoCircle: {
    width: 128,
    height: 128,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  star: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    backgroundColor: '#fde047',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starText: {
    fontSize: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 32,
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  emoji: {
    fontSize: 32,
  },
  // SPINNER avec icône (alternative)
  spinnerIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // SPINNER CORRIGÉ avec container
  spinnerContainer: {
    width: 40,
    height: 40,
    marginBottom: 16,
  },
  spinner: {
    width: 40,
    height: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#ffffff',
    borderRightColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    backgroundColor: 'transparent', // Assure un fond transparent
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  particle: {
    position: 'absolute',
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.1)',
  },
});

export default SplashScreen;
