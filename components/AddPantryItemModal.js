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
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

export default function AddPantryItemModal({ visible, onClose, onAdd, onUpdate, itemToEdit }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('1'); 
  const [unit, setUnit] = useState('pcs');   
  const [category, setCategory] = useState('Other');
  const [notes, setNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const units = ['pcs', 'kg', 'g', 'L', 'ml', 'lb', 'oz', 'pack', 'can'];
  const categories = ['Produce', 'Dairy', 'Meat', 'Grain', 'Snack', 'Other'];

  // Helper: Format Date Object to "YYYY-MM-DD" String (Local Time)
  const formatDateLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (visible) {
      if (itemToEdit) {
        setName(itemToEdit.name);
        setAmount(itemToEdit.amount);
        setUnit(itemToEdit.unit);
        setCategory(itemToEdit.category);
        setNotes(itemToEdit.notes || '');
        
        // Parse the stored string "YYYY-MM-DD" back into a Local Date object for the picker
        const dateParts = itemToEdit.expiryDate.split('-');
        const editDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        // Force time to midnight just to be safe
        editDate.setHours(0, 0, 0, 0); 
        setExpiryDate(editDate); 
      } else {
        // Reset defaults
        setName('');
        setAmount('1');
        setUnit('pcs');
        setCategory('Other');
        setNotes('');
        
        // Default to Today, ensuring time is 00:00:00
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setExpiryDate(today);
      }
    }
  }, [visible, itemToEdit]);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || expiryDate;
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    // STRICT: Strip the time component immediately upon selection
    currentDate.setHours(0, 0, 0, 0);
    
    setExpiryDate(currentDate);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;

    const itemData = {
      name,
      amount, 
      unit,
      category,
      notes,
      // This saves purely the date string "2025-12-05". 
      // The database will have absolutely no knowledge of the time.
      expiryDate: formatDateLocal(expiryDate), 
    };

    if (itemToEdit) {
      onUpdate(itemToEdit.id, itemData);
    } else {
      onAdd({ ...itemData, createdAt: new Date() });
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
              <Text style={styles.title}>{itemToEdit ? "Edit Item" : "Add New Item"}</Text>
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

              <Text style={styles.label}>Expiry Date</Text>
              <TouchableOpacity 
                style={styles.dateButton} 
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDateLocal(expiryDate)}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={expiryDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                />
              )}

              {showDatePicker && Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.iosDatePickerButton} 
                  onPress={() => setShowDatePicker(false)}>
                  <Text style={{color: 'white', fontWeight: 'bold'}}>Confirm Date</Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.label, { marginTop: 15 }]}>Notes (Optional)</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., For lasagna" 
                value={notes}
                onChangeText={setNotes}
              />

              <TouchableOpacity 
                style={[styles.addButton, !name.trim() && styles.disabledButton]} 
                onPress={handleSubmit}
                disabled={!name.trim()}
              >
                <Text style={styles.addButtonText}>{itemToEdit ? "UPDATE ITEM" : "ADD ITEM"}</Text>
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FAFAFA',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
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
  iosDatePickerButton: {
    backgroundColor: '#D35400',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  }
});