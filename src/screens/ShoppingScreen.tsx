import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Shopping'>;

const ShoppingScreen: React.FC<Props> = ({ navigation }) => {
  const { shoppingList } = useAppContext();

  const categories = ['Féculents', 'Viande', 'Frais', 'Fromage', 'Légumes', 'Légumineuses', 'Autres'];

  // Calculer le budget estimé en FCFA
  const estimatedBudgetEUR = shoppingList.length * 5; // Estimation simple : 5€ par article
  const estimatedBudgetFCFA = estimatedBudgetEUR * 656;

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Liste de Courses</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Statistiques */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View>
              <Text style={styles.statsNumber}>{shoppingList.length} articles</Text>
              <Text style={styles.statsDetail}>
                {shoppingList.filter((item) => item.bought).length} achetés •{' '}
                {shoppingList.filter((item) => !item.bought).length} restants
              </Text>
            </View>
            <View style={styles.budget}>
              <Text style={styles.budgetNumber}>~{estimatedBudgetFCFA.toLocaleString()} FCFA</Text>
              <Text style={styles.budgetLabel}>Budget estimé</Text>
            </View>
          </View>
        </View>

        {/* Liste par catégorie */}
        {categories.map((category) => {
          const items = shoppingList.filter((item) => item.category === category);
          if (items.length === 0) {return null;}

          return (
            <View key={category} style={styles.categoryCard}>
              <View style={styles.categoryHeader}>
                <MaterialCommunityIcons name="package-variant-closed" size={20} color="#f97316" />
                <Text style={styles.categoryTitle}>{category}</Text>
              </View>
              {items.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.itemRow,
                    item.bought ? styles.boughtItem : styles.unboughtItem,
                  ]}
                >
                  <TouchableOpacity style={styles.checkbox}>
                    {item.bought && (
                      <MaterialCommunityIcons name="check-circle" size={16} color="#fff" />
                    )}
                  </TouchableOpacity>
                  <Text
                    style={[
                      styles.itemText,
                      item.bought && styles.boughtItemText,
                    ]}
                  >
                    {item.item}
                  </Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Bouton IA */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('AIGenerate')}
        >
          <Text style={styles.aiButtonText}>✨ Générer avec l'IA</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bouton flottant "+" */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddShoppingItem')}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerIcons: { flexDirection: 'row', alignItems: 'center' },
  icon: { marginHorizontal: 8 },
  profileIcon: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 80 },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    elevation: 2,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statsNumber: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  statsDetail: { fontSize: 14, color: '#6B7280' },
  budget: { alignItems: 'flex-end' },
  budgetNumber: { fontSize: 24, fontWeight: 'bold', color: '#16a34a' },
  budgetLabel: { fontSize: 14, color: '#6B7280' },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  categoryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  boughtItem: { backgroundColor: '#ecfdf5' },
  unboughtItem: { backgroundColor: '#f3f4f6' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: '#fff',
  },
  itemText: { fontSize: 16, color: '#1F2937' },
  boughtItemText: { textDecorationLine: 'line-through', color: '#6B7280' },
  aiButton: {
    backgroundColor: '#a855f7',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  aiButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  floatingButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: '#f97316',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
});

export default ShoppingScreen;
