import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Modal } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useAppContext } from '../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Stock'>;

const StockScreen: React.FC<Props> = ({ navigation }) => {
  const { stock, setStock } = useAppContext();

  const goodItems = stock.filter((item) => item.status === 'good').length;
  const warningItems = stock.filter((item) => item.status === 'warning').length;
  const urgentItems = stock.filter((item) => item.status === 'urgent').length;

  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', quantity: '', expiry: '', status: 'good' as 'good' | 'warning' | 'urgent' });

  const handleAddStock = () => {
    if (newItem.name && newItem.quantity && newItem.expiry) {
      setStock([...stock, { ...newItem, expiry: new Date(newItem.expiry).toISOString().split('T')[0] }]);
      setModalVisible(false);
      setNewItem({ name: '', quantity: '', expiry: '', status: 'good' });
    } else {
      alert('Veuillez remplir tous les champs.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Alertes */}
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

        {/* Liste du stock */}
        {stock.map((item, idx) => (
          <View
            key={idx}
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
                {new Date(item.expiry).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.stockActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="pencil" size={16} color="#3b82f6" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Bouton scanner */}
        <TouchableOpacity style={styles.scanButton}>
          <LinearGradient colors={['#60a5fa', '#a855f7']} style={styles.gradientButton}>
            <MaterialCommunityIcons name="camera" size={20} color="#fff" style={styles.scanIcon} />
            <Text style={styles.scanButtonText}>Scanner un produit</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Bouton flottant "+" */}
      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() => setModalVisible(true)}
      >
        <MaterialCommunityIcons name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Modal pour ajouter un élément */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un produit</Text>
            <TextInput
              style={styles.input}
              placeholder="Nom du produit"
              value={newItem.name}
              onChangeText={(text) => setNewItem({ ...newItem, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantité (ex: 500g, 2 kg)"
              value={newItem.quantity}
              onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Date d'expiration (AAAA-MM-JJ)"
              value={newItem.expiry}
              onChangeText={(text) => setNewItem({ ...newItem, expiry: text })}
            />
            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Statut :</Text>
              <TouchableOpacity
                style={[styles.statusButton, newItem.status === 'good' && styles.statusSelected]}
                onPress={() => setNewItem({ ...newItem, status: 'good' })}
              >
                <Text style={styles.statusText}>Bon</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, newItem.status === 'warning' && styles.statusSelected]}
                onPress={() => setNewItem({ ...newItem, status: 'warning' })}
              >
                <Text style={styles.statusText}>Attention</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.statusButton, newItem.status === 'urgent' && styles.statusSelected]}
                onPress={() => setNewItem({ ...newItem, status: 'urgent' })}
              >
                <Text style={styles.statusText}>Urgent</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddStock}>
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  goodBorder: { borderLeftColor: '#16a34a' },
  warningBorder: { borderLeftColor: '#facc15' },
  urgentBorder: { borderLeftColor: '#ef4444' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4 },
  stockDetail: { fontSize: 14, color: '#6B7280' },
  stockActions: { flexDirection: 'row', gap: 8 },
  actionButton: { padding: 8, borderRadius: 999, backgroundColor: '#f3f4f6' },
  scanButton: { marginTop: 16, marginBottom: 24 },
  gradientButton: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanIcon: { marginRight: 8 },
  scanButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  statusContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  statusLabel: { fontSize: 14, fontWeight: '500', color: '#1F2937', marginBottom: 8 }, // Ajouté ici
  statusButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
  },
  statusSelected: { backgroundColor: '#a855f7' },
  statusText: { fontSize: 14, color: '#1F2937', textAlign: 'center' },
  addButton: {
    backgroundColor: '#a855f7',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default StockScreen;

function alert(_arg0: string) {
  throw new Error('Function not implemented.');
}
