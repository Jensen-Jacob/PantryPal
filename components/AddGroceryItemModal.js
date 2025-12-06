import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddGroceryItemModal({ visible, onClose, onAdd, onUpdate, itemToEdit }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('1'); 
  const [unit, setUnit] = useState('pcs');   
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');

  const units = ['pcs', 'kg', 'g', 'L', 'ml', 'lb', 'oz', 'pack', 'can'];
  const categories = ['Produce', 'Dairy', 'Meat', 'Grain', 'Snack', 'Other'];

  useEffect(() => {
    if (visible) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setAmount(itemToEdit.amount);
        setUnit(itemToEdit.unit);
        setCategory(itemToEdit.category);
        setNotes(itemToEdit.notes || '');
      } else {
        setName('');
        setAmount('1');
        setUnit('pcs');
        setCategory('Other');
        setNotes('');
      }
    }
  }, [visible, itemToEdit]);

  const handleSave = () => {
    if (!name.trim()) return;

    const itemData = {
      name,
      amount, 
      unit,
      category,
      notes,
      ...(itemToEdit ? {} : { completed: false, createdAt: new Date() })
    };

    if (itemToEdit) {
      onUpdate(itemToEdit.id, itemData);
    } else {
      onAdd(itemData);
    }
    
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            style={styles.modalContent}
          >
            
            <View style={styles.header}>
              <Text style={styles.title}>{itemToEdit ? "Edit Item" : "Add to Grocery List"}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Item Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., Milk, Potatoes" 
                value={name}
                onChangeText={setName}
              />

              <View style={styles.row}>
                <View style={[styles.halfInput, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.label}>Amount</Text>
                  <TextInput 
                    style={styles.input} 
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    placeholder="1"
                  />
                </View>

                <View style={{ flex: 2 }}>
                  <Text style={styles.label}>Unit</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                    {units.map((u) => (
                      <TouchableOpacity 
                        key={u} 
                        style={[styles.unitChip, unit === u && styles.activeChip]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.chipText, unit === u && styles.activeChipText]}>{u}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.label}>Category</Text>
              <View style={styles.chipContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity 
                    key={cat} 
                    style={[styles.chip, category === cat && styles.activeChip]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.chipText, category === cat && styles.activeChipText]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { marginTop: 15 }]}>Notes (Optional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., Brand preference" 
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity 
                style={[styles.addButton, !name.trim() && styles.disabledButton]} 
                onPress={handleSave}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>{itemToEdit ? "UPDATE" : "ADD TO LIST"}</Text>
              </TouchableOpacity>
              
              <View style={{ height: 20 }} />

            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%', 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  unitScroll: {
    marginBottom: 15,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeChip: {
    backgroundColor: '#D35400',
    borderColor: '#D35400',
  },
  chipText: {
    color: '#666',
  },
  activeChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#D35400',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});