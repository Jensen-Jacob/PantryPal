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
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddEditRecipeModal({ visible, onClose, onSave, onDelete, recipeToEdit }) {
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');
  
  const [ingName, setIngName] = useState('');
  const [ingAmount, setIngAmount] = useState('1');
  const [ingUnit, setIngUnit] = useState('pcs');
  
  const [ingredients, setIngredients] = useState([]);

  const units = ['pcs', 'kg', 'g', 'L', 'ml', 'lb', 'oz', 'cup', 'tsp', 'tbsp', 'pack', 'can'];

  useEffect(() => {
    if (visible) {
      if (recipeToEdit) {
        setName(recipeToEdit.name);
        setInstructions(recipeToEdit.instructions);
        setIngredients(recipeToEdit.ingredients || []);
      } else {
        setName('');
        setInstructions('');
        setIngredients([]);
        resetIngredientInput();
      }
    }
  }, [visible, recipeToEdit]);

  const resetIngredientInput = () => {
    setIngName('');
    setIngAmount('1');
    setIngUnit('pcs');
  };

  const addIngredient = () => {
    if (ingName.trim()) {
      const newIng = {
        name: ingName.trim(),
        amount: ingAmount,
        unit: ingUnit
      };
      setIngredients([...ingredients, newIng]);
      resetIngredientInput();
    }
  };

  const removeIngredient = (index) => {
    const newList = [...ingredients];
    newList.splice(index, 1);
    setIngredients(newList);
  };

  const handleSave = () => {
    if (!name.trim() || ingredients.length === 0) {
      Alert.alert('Error', 'Please provide a name and at least one ingredient.');
      return;
    }

    const recipeData = {
      name,
      instructions,
      ingredients,
    };

    if (recipeToEdit) {
      onSave(recipeToEdit.id, recipeData);
    } else {
      onSave(null, recipeData);
    }
    onClose();
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => {
            onDelete(recipeToEdit.id);
            onClose();
          } 
        }
      ]
    );
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
              <Text style={styles.title}>{recipeToEdit ? "Recipe Details" : "New Recipe"}</Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              
              <Text style={styles.label}>Recipe Name</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g., Pancakes" 
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Add Ingredient</Text>
              <View style={styles.ingredientBuilder}>
                
                <TextInput 
                  style={[styles.input, { marginBottom: 10 }]} 
                  placeholder="Ingredient Name (e.g. Flour)" 
                  value={ingName}
                  onChangeText={setIngName}
                />

                <View style={styles.row}>
                  <View style={{ width: '30%', marginRight: 10 }}>
                    <TextInput 
                      style={styles.input} 
                      value={ingAmount}
                      onChangeText={setIngAmount}
                      keyboardType="numeric"
                      placeholder="1"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
                      {units.map((u) => (
                        <TouchableOpacity 
                          key={u} 
                          style={[styles.unitChip, ingUnit === u && styles.activeChip]}
                          onPress={() => setIngUnit(u)}
                        >
                          <Text style={[styles.chipText, ingUnit === u && styles.activeChipText]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <TouchableOpacity onPress={addIngredient} style={styles.addIngButton}>
                  <Text style={styles.addIngButtonText}>+ Add Ingredient</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.chipContainer}>
                {ingredients.map((ing, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>
                      {ing.amount} {ing.unit} {ing.name}
                    </Text>
                    <TouchableOpacity onPress={() => removeIngredient(index)}>
                      <Ionicons name="close-circle" size={20} color="#666" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Instructions</Text>
              <TextInput 
                style={[styles.input, styles.textArea]} 
                placeholder="Step 1: Mix ingredients..." 
                value={instructions}
                onChangeText={setInstructions}
                multiline={true}
                numberOfLines={4}
                textAlignVertical="top"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {recipeToEdit ? "UPDATE RECIPE" : "SAVE RECIPE"}
                </Text>
              </TouchableOpacity>

              {recipeToEdit && (
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Text style={styles.deleteButtonText}>DELETE RECIPE</Text>
                </TouchableOpacity>
              )}
              
              <View style={{ height: 40 }} />

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
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
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
  textArea: {
    minHeight: 100,
  },
  ingredientBuilder: {
    backgroundColor: '#F9F9F9',
    padding: 10,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  unitScroll: {
    height: 40,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'white',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 36,
    justifyContent: 'center'
  },
  activeChip: {
    backgroundColor: '#D35400',
    borderColor: '#D35400',
  },
  chipText: {
    color: '#666',
    fontSize: 13,
  },
  activeChipText: {
    color: 'white',
    fontWeight: 'bold',
  },
  addIngButton: {
    backgroundColor: '#D35400',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addIngButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  saveButton: {
    backgroundColor: '#27AE60',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#C0392B',
  },
  deleteButtonText: {
    color: '#C0392B',
    fontSize: 16,
    fontWeight: 'bold',
  }
});