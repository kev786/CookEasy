import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { generateText } from '../services/GeminiService';

interface GeminiComponentProps {
  initialPrompt?: string;
  onGenerate?: (text: string) => void;
  placeholder?: string;
  buttonText?: string;
  style?: any;
}

const GeminiComponent: React.FC<GeminiComponentProps> = ({
  initialPrompt = '',
  onGenerate,
  placeholder = "Entrez votre demande à l'IA...",
  buttonText = 'Générer avec IA',
  style,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async (): Promise<void> => {
    if (!prompt.trim()) {
      Alert.alert('Attention', 'Veuillez entrer une demande avant de générer.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await generateText(prompt);
      setResponse(result);
      if (onGenerate) {
        onGenerate(result);
      }
    } catch (error) {
      const errorMessage = 'Erreur lors de la génération. Veuillez réessayer.';
      setResponse(errorMessage);
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputSection}>
        <Text style={styles.label}>🤖 Demande à l'IA</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity
          style={[styles.generateButton, isLoading && styles.generateButtonDisabled]}
          onPress={handleGenerate}
          disabled={isLoading}
        >
          <LinearGradient
            colors={isLoading ? ['#9CA3AF', '#6B7280'] : ['#a855f7', '#ec4899']}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <MaterialCommunityIcons name="loading" size={20} color="#fff" />
            ) : (
              <MaterialCommunityIcons name="magic-staff" size={20} color="#fff" />
            )}
            <Text style={styles.buttonText}>
              {isLoading ? 'Génération en cours...' : buttonText}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {response ? (
        <View style={styles.responseSection}>
          <View style={styles.responseHeader}>
            <MaterialCommunityIcons name="robot" size={20} color="#a855f7" />
            <Text style={styles.responseLabel}>Réponse de l'IA</Text>
          </View>
          <View style={styles.responseContainer}>
            <Text style={styles.responseText}>{response}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
  },

  inputSection: {
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },

  inputContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },

  input: {
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },

  generateButton: {
    alignSelf: 'flex-end',
  },

  generateButtonDisabled: {
    opacity: 0.7,
  },

  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },

  responseSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },

  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a855f7',
    marginLeft: 8,
  },

  responseContainer: {
    backgroundColor: '#f3e8ff',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#a855f7',
  },

  responseText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});

export default GeminiComponent;
