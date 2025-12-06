import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PantryItemCard({ item, onDelete, onPress }) {
  
  const getIcon = (category) => {
    switch (category) {
      case 'Produce': return 'nutrition';
      case 'Dairy': return 'water'; 
      case 'Meat': return 'restaurant';
      case 'Grain': return 'leaf'; 
      case 'Snack': return 'pizza';
      default: return 'cube';
    }
  };

  const getExpiryStatus = (dateString) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(dateString);
    
    const diffTime = expiry - today; 
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays <= 0) {
      return { color: '#C0392B', label: 'Expired' }; 
    } else if (diffDays <= 7) {
      return { color: '#E67E22', label: 'Expiring soon' }; 
    } else if (diffDays <= 14) {
      return { color: '#ffe347ff', label: 'Expiring in 2 weeks' }; 
    } else {
      return { color: '#27AE60', label: null }; 
    }
  };

  const { color, label } = getExpiryStatus(item.expiryDate);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)}>
      <View style={styles.iconContainer}>
        <Ionicons name={getIcon(item.category)} size={24} color="#D35400" />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.name}</Text>
        
        <Text style={[styles.expiry, { color: color, fontWeight: 'bold' }]}>
          Exp: {item.expiryDate} {label ? `(${label})` : ''}
        </Text>
        
        {item.notes ? <Text style={styles.notes} numberOfLines={1}>{item.notes}</Text> : null}
      </View>

      <View style={styles.rightContainer}>
        <View style={styles.quantityBadge}>
          <Text style={styles.quantityText}>{item.amount} {item.unit}</Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={20} color="#999" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF5F0', 
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  expiry: {
    fontSize: 12,
    marginTop: 2,
  },
  notes: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  quantityBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#eee'
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#555',
  },
  deleteButton: {
    padding: 5,
  }
});