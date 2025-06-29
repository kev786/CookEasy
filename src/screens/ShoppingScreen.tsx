import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, ShoppingItem, ShoppingListEntry } from '../types'; // Importez ShoppingItem et ShoppingListEntry
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Shopping'>;

const ShoppingScreen: React.FC<Props> = ({ navigation }) => {
  // On récupère shoppingLists, updateShoppingItem ET removeShoppingList du contexte
  const { shoppingLists, updateShoppingItem, removeShoppingList } = useAppContext();

  const categories = ['Féculents', 'Viande', 'Frais', 'Fromage', 'Légumes', 'Légumineuses', 'Boissons', 'Produits Laitiers', 'Boulangerie', 'Autres']; // Catégories étendues

  // Fonction pour calculer le budget estimé d'une seule liste de courses
  const calculateListBudget = (items: ShoppingItem[]): number => {
    // priceEstimate est maintenant garanti d'être un nombre
    // Les valeurs sont déjà en FCFA, donc pas de conversion ici
    const estimatedBudgetFCFA = items.reduce((sum, item) => sum + item.priceEstimate, 0);
    return estimatedBudgetFCFA; // Retourne le budget en FCFA
  };

  const handleToggleBought = (listId: string, itemId: string, currentStatus: boolean) => {
    updateShoppingItem(listId, itemId, { bought: !currentStatus });
  };

  const handleDeleteList = (listId: string, listName: string) => {
    Alert.alert(
      'Confirmer la suppression',
      `Voulez-vous vraiment supprimer la liste "${listName}" ? Cette action est irréversible.`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          onPress: () => {
            removeShoppingList(listId);
            Alert.alert('Supprimé', `La liste "${listName}" a été supprimée.`);
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mes Listes de Courses</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {shoppingLists.length === 0 ? (
          <View style={styles.emptyListContainer}>
            <MaterialCommunityIcons name="shopping-outline" size={60} color="#CCC" />
            <Text style={styles.emptyListText}>Aucune liste de courses pour le moment.</Text>
            <Text style={styles.emptyListSubText}>Appuyez sur le bouton '+' pour en ajouter une !</Text>
          </View>
        ) : (
          shoppingLists.map((list) => {
            const totalItems = list.items.length;
            const boughtItems = list.items.filter((item) => item.bought).length;
            const remainingItems = totalItems - boughtItems;
            // Utilisation directe du budget estimé en FCFA
            const estimatedBudgetFCFA = calculateListBudget(list.items);

            return (
              <View key={list.id} style={styles.shoppingListCard}>
                <View style={styles.listHeader}>
                  <Text style={styles.listTitle}>{list.name}</Text>
                  <View style={styles.listActions}> {/* Conteneur pour les actions de liste */}
                    <View style={styles.budgetBadge}>
                      <Text style={styles.budgetBadgeText}>~{estimatedBudgetFCFA.toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteList(list.id, list.name)}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons name="delete-outline" size={24} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.listStatsDetail}>
                  {totalItems} articles • {boughtItems} achetés • {remainingItems} restants
                </Text>

                {categories.map((category) => {
                  const itemsInCategory = list.items.filter((item) => item.category === category);
                  if (itemsInCategory.length === 0) {
                    return null;
                  }

                  return (
                    <View key={category} style={styles.categorySection}>
                      <View style={styles.categoryHeader}>
                        <MaterialCommunityIcons name="package-variant-closed" size={18} color="#f97316" />
                        <Text style={styles.categoryTitleSmall}>{category}</Text>
                      </View>
                      {itemsInCategory.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemRow,
                            item.bought ? styles.boughtItem : styles.unboughtItem,
                          ]}
                          onPress={() => handleToggleBought(list.id, item.id, item.bought)}
                        >
                          <View style={[styles.checkbox, item.bought && styles.checkboxChecked]}>
                            {item.bought && (
                              <MaterialCommunityIcons name="check" size={16} color="#fff" />
                            )}
                          </View>
                          <Text
                            style={[
                              styles.itemText,
                              item.bought && styles.boughtItemText,
                            ]}
                          >
                            {/* Modifications ici pour utiliser des Text imbriqués */}
                            <Text>{`${item.item} (${item.quantity} ${item.unit})`}</Text>
                            {item.unitPrice ? <Text>{` - ${(item.unitPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })}/ ${item.unit}`}</Text> : null}
                            {item.priceEstimate ? <Text>{` (Total: ${(item.priceEstimate).toLocaleString('fr-FR', { style: 'currency', currency: 'XOF' })})`}</Text> : null}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {/* Bouton IA */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => navigation.navigate('AIGenerate')}
        >
          <Text style={styles.aiButtonText}>✨ Générer avec l'IA</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Boutons flottants */}
      <TouchableOpacity
        style={[styles.floatingButton, styles.marketMapButton]}
        onPress={() => navigation.navigate('MarketMap')}
      >
        <MaterialCommunityIcons name="store" size={24} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.floatingButton, styles.addShoppingItemButton]}
        onPress={() => navigation.navigate('AddShoppingItem')}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 16 },
  headerButton: { padding: 8, borderRadius: 20 },
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
  content: { padding: 16, paddingBottom: 100 },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
    padding: 20,
  },
  emptyListText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6B7280',
    marginTop: 10,
    textAlign: 'center',
  },
  emptyListSubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 5,
    textAlign: 'center',
  },
  shoppingListCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 10,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    flexShrink: 1, // Permet au titre de s'adapter
    marginRight: 10,
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  budgetBadge: {
    backgroundColor: '#16a34a', // Green color for budget
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  budgetBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  deleteButton: {
    padding: 5,
    borderRadius: 5,
  },
  listStatsDetail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 15,
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  categoryTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  boughtItem: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  unboughtItem: {
    backgroundColor: '#fff',
    borderColor: '#E5E7EB',
  },
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
  checkboxChecked: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  itemText: {
    fontSize: 15, // Légèrement réduit pour plus d'informations
    color: '#1F2937',
    flexShrink: 1,
  },
  boughtItemText: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
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
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#f97316',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  marketMapButton: {
    bottom: 80,
  },
  addShoppingItemButton: {
    bottom: 20,
  },
});

export default ShoppingScreen;