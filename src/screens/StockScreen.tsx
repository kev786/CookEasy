// src/screens/StockScreen.tsx

import React from 'react'; // Pas besoin de useState si vous ne l'utilisez pas directement ici
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, StockItem } from '../types'; // Importez StockItem
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Stock'>;

const StockScreen: React.FC<Props> = ({ navigation }) => {
  const { stock, setStock } = useAppContext();

  // Calcul du nombre d'éléments par statut
  const goodItems = stock.filter((item) => item.status === 'good').length;
  const warningItems = stock.filter((item) => item.status === 'warning').length;
  const urgentItems = stock.filter((item) => item.status === 'urgent').length;

  // Fonction pour gérer la navigation vers l'écran de modification
  const handleEditStock = (item: StockItem) => {
    // Navigue vers l'écran 'UpdateStock' en passant l'élément complet à éditer
    navigation.navigate('UpdateStock', { itemToEdit: item });
  };

  // Fonction de suppression (inchangée)
  const handleDeleteStock = (index: number) => {
    console.log(`Supprimer l'élément à l'index: ${index}`);
    setStock(prevStock => prevStock.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {/* En-tête de la page */}
      <LinearGradient colors={['#f97316', '#ef4444']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mon Stock</Text>
          <View style={styles.headerIcons}>
            <MaterialCommunityIcons name="bell" size={24} color="#fff" style={styles.icon} />
            <View style={styles.profileIcon}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* Contenu principal de l'écran avec défilement */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Grille d'alertes par statut */}
        <View style={styles.alertGrid}>
          <View style={styles.alertCardGood}>
            <Text style={styles.alertNumberGood}>{goodItems}</Text>
            <Text style={styles.alertLabelGood}>Bon état</Text>
          </View>
          <View style={styles.alertCardWarning}>
            <Text style={styles.alertNumberWarning}>{warningItems}</Text>
            <Text style={styles.alertLabelWarning}>Attention</Text>
          </View>
          <View style={styles.alertCardUrgent}>
            <Text style={styles.alertNumberUrgent}>{urgentItems}</Text>
            <Text style={styles.alertLabelUrgent}>Urgent</Text>
          </View>
        </View>

        {/* Liste des éléments du stock */}
        {stock.length === 0 ? (
          <Text style={styles.emptyStockText}>Aucun produit en stock pour le moment. Ajoutez-en un !</Text>
        ) : (
          stock.map((item, idx) => (
            <View
              key={item.id || idx} // Utilisez l'ID unique si disponible, sinon l'index
              style={[
                styles.stockCard,
                item.status === 'good' && styles.goodBorder,
                item.status === 'warning' && styles.warningBorder,
                item.status === 'urgent' && styles.urgentBorder,
              ]}
            >
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockDetail}>
                  Quantité: {item.quantity} • Expire le{' '}
                  {new Date(item.expiry).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <View style={styles.stockActions}>
                {/* Bouton d'édition qui navigue vers UpdateStockScreen */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditStock(item)} // Passer l'objet item entier
                >
                  <MaterialCommunityIcons name="pencil" size={16} color="#3b82f6" />
                </TouchableOpacity>
                {/* Bouton de suppression */}
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteStock(idx)}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Bouton Scanner un produit */}
        <TouchableOpacity style={styles.scanButton}>
          <LinearGradient colors={['#60a5fa', '#a855f7']} style={styles.gradientButton}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" style={styles.scanIcon} />
            <Text style={styles.scanButtonText}>Scanner un produit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Bouton flottant "+" pour ajouter un produit, navigue vers AddStockScreen */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddStock')}
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
  content: { padding: 16 },
  alertGrid: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  alertCardGood: { flex: 1, backgroundColor: '#d1fae5', padding: 12, borderRadius: 12, alignItems: 'center' },
  alertCardWarning: { flex: 1, backgroundColor: '#fefce8', padding: 12, borderRadius: 12, alignItems: 'center' },
  alertCardUrgent: { flex: 1, backgroundColor: '#fef2f2', padding: 12, borderRadius: 12, alignItems: 'center' },
  alertNumberGood: { fontSize: 18, fontWeight: 'bold', color: '#16a34a' },
  alertNumberWarning: { fontSize: 18, fontWeight: 'bold', color: '#ca8a04' },
  alertNumberUrgent: { fontSize: 18, fontWeight: 'bold', color: '#b91c1c' },
  alertLabelGood: { fontSize: 12, color: '#16a34a' },
  alertLabelWarning: { fontSize: 12, color: '#ca8a04' },
  alertLabelUrgent: { fontSize: 12, color: '#b91c1c' },
  stockCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
  },
  goodBorder: { borderLeftColor: '#16a34a' },
  warningBorder: { borderLeftColor: '#facc15' },
  urgentBorder: { borderLeftColor: '#ef4444' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  stockDetail: { fontSize: 14, color: '#6B7280' },
  stockActions: { flexDirection: 'row', gap: 8 },
  actionButton: {
    padding: 8,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  scanButton: {
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: { marginRight: 8 },
  scanButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    backgroundColor: '#f97316',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5.46,
  },
  emptyStockText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default StockScreen;