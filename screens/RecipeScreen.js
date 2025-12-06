import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ImageBackground, 
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';

import AddEditRecipeModal from '../components/AddEditRecipeModal';

export default function RecipeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [pantryItems, setPantryItems] = useState([]); 
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null); 

  const userEmail = auth.currentUser?.email || 'Guest';
  const userId = auth.currentUser?.uid;

  const handleLogout = () => {
    setMenuVisible(false);
    signOut(auth).then(() => navigation.replace('Login'));
  };

  const navigateTo = (screenName) => {
    setMenuVisible(false);
    navigation.navigate(screenName);
  };

  useEffect(() => {
    if (!userId) return;

    const pantryQ = query(collection(db, 'pantry'), where('userId', '==', userId));
    const unsubPantry = onSnapshot(pantryQ, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setPantryItems(items);
    });

    const recipeQ = query(collection(db, 'recipes'), where('userId', '==', userId));
    const unsubRecipes = onSnapshot(recipeQ, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push({ ...doc.data(), id: doc.id }));
      setRecipes(items);
    });

    return () => {
      unsubPantry();
      unsubRecipes();
    };
  }, []);

  const handleSaveRecipe = async (id, data) => {
    try {
      if (id) {
        await updateDoc(doc(db, 'recipes', id), data);
      } else {
        await addDoc(collection(db, 'recipes'), {
          ...data,
          userId: userId,
          createdAt: new Date()
        });
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleDeleteRecipe = async (id) => {
    try {
      await deleteDoc(doc(db, 'recipes', id));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const openAdd = () => {
    setSelectedRecipe(null);
    setModalVisible(true);
  };

  const openDetails = (item) => {
    setSelectedRecipe(item);
    setModalVisible(true);
  };

 
  const normalizeAmount = (amount, unit) => {
    const val = parseFloat(amount) || 0;
    const u = unit.toLowerCase();

    if (u === 'kg') return { val: val * 1000, type: 'mass' };
    if (u === 'lb') return { val: val * 453.59, type: 'mass' };
    if (u === 'oz') return { val: val * 28.35, type: 'mass' };
    if (u === 'g') return { val: val, type: 'mass' };

    if (u === 'l') return { val: val * 1000, type: 'vol' };
    if (u === 'cup') return { val: val * 236.58, type: 'vol' };
    if (u === 'tbsp') return { val: val * 15, type: 'vol' };
    if (u === 'tsp') return { val: val * 5, type: 'vol' };
    if (u === 'ml') return { val: val, type: 'vol' };

    return { val: val, type: 'count' };
  };

  const isExpired = (dateString) => {
    if (!dateString) return false; 
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(dateString);
    return expiry < today; 
  };

  const checkIngredients = (requiredIngredients = []) => {
    if (!requiredIngredients.length) return [];
    
    return requiredIngredients.filter(reqIng => {
      const reqName = (typeof reqIng === 'string' ? reqIng : reqIng.name).toLowerCase();
      const reqAmountRaw = typeof reqIng === 'object' ? reqIng.amount : '1';
      const reqUnitRaw = typeof reqIng === 'object' ? reqIng.unit : 'pcs';
      const reqNorm = normalizeAmount(reqAmountRaw, reqUnitRaw);

      const matchingPantryItems = pantryItems.filter(pItem => {
        const isMatch = pItem.name.toLowerCase().includes(reqName);
        const notExpired = !isExpired(pItem.expiryDate);
        return isMatch && notExpired;
      });

      let totalPantryAmount = 0;
      if (matchingPantryItems.length > 0) {
        matchingPantryItems.forEach(pItem => {
          const pNorm = normalizeAmount(pItem.amount, pItem.unit);
          if (pNorm.type === reqNorm.type) {
            totalPantryAmount += pNorm.val;
          }
        });
      }

      return totalPantryAmount < reqNorm.val;
    });
  };

  const addMissingToGrocery = async (missingIngredients) => {
    try {
      const promises = missingIngredients.map(reqIng => {
        const reqName = typeof reqIng === 'string' ? reqIng : reqIng.name;
        const amount = typeof reqIng === 'object' ? reqIng.amount : '1';
        const unit = typeof reqIng === 'object' ? reqIng.unit : 'pcs';

        return addDoc(collection(db, 'grocery'), {
          name: reqName,
          amount: amount,
          unit: unit,
          category: 'Other', 
          completed: false,
          userId: userId,
          createdAt: new Date(),
        });
      });
      
      await Promise.all(promises);
      Alert.alert('Success', `Added ${missingIngredients.length} items to your Grocery List.`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const renderRecipe = ({ item }) => {
    const missing = checkIngredients(item.ingredients);
    const canMake = missing.length === 0;

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => openDetails(item)}
        activeOpacity={0.8}
      >
        <View style={styles.headerRow}>
          <Text style={styles.recipeName}>{item.name}</Text>
          {canMake ? (
            <Ionicons name="checkmark-circle" size={28} color="#27AE60" />
          ) : (
            <Ionicons name="alert-circle" size={28} color="#E67E22" />
          )}
        </View>

        <Text style={styles.subHeader}>Ingredients:</Text>
        <View style={styles.ingredientsList}>
          {(item.ingredients || []).map((ing, index) => {
            const ingName = typeof ing === 'string' ? ing : ing.name;
            const ingLabel = typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`;
            const isMissing = missing.some(m => (typeof m === 'string' ? m : m.name) === ingName);
            
            return (
              <Text 
                key={index} 
                style={[
                  styles.ingredient, 
                  isMissing ? styles.missingIngredient : styles.haveIngredient
                ]}
              >
                • {ingLabel}
              </Text>
            );
          })}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: canMake ? '#E8F8F5' : '#FEF5E7' }]}>
          <Text style={[styles.statusText, { color: canMake ? '#27AE60' : '#D35400' }]}>
            {canMake ? "Ready to Cook!" : `Missing ${missing.length} items`}
          </Text>
        </View>

        {!canMake && (
          <TouchableOpacity 
            style={styles.addMissingButton}
            onPress={() => addMissingToGrocery(missing)}
          >
            <Text style={styles.addMissingText}>+ Add Missing to Grocery List</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ImageBackground 
        source={require('../assets/mainBackground.png')} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Ionicons name="menu" size={32} color="#D35400" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Recipes</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.contentContainer}>
          {recipes.length === 0 ? (
            <Text style={styles.placeholderText}>No recipes yet. Add your first one!</Text>
          ) : (
            <FlatList
              data={recipes}
              keyExtractor={item => item.id}
              renderItem={renderRecipe}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <AddEditRecipeModal 
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSave={handleSaveRecipe}
          onDelete={handleDeleteRecipe}
          recipeToEdit={selectedRecipe}
        />

        <Modal
          animationType="fade"
          transparent={true}
          visible={menuVisible}
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPressOut={() => setMenuVisible(false)}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.menuContainer, { paddingTop: insets.top + 20 }]}>
                
                <View style={styles.userInfoSection}>
                  <View style={styles.profileBubble}>
                    <Ionicons name="person" size={30} color="#FFF" />
                  </View>
                  <Text style={styles.userEmail}>{userEmail}</Text>
                </View>

                <View style={styles.divider} />

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Home')}>
                  <Ionicons name="home-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>My Pantry</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Grocery')}>
                  <Ionicons name="cart-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>Grocery List</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Ionicons name="restaurant-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>Recipes</Text>
                </TouchableOpacity>

                <View style={styles.spacer} />

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={24} color="#FFF" />
                  <Text style={styles.logoutText}>Sign Out</Text>
                </TouchableOpacity>

              </View>
            </TouchableWithoutFeedback>
          </TouchableOpacity>
        </Modal>

      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    elevation: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D35400',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  placeholderText: {
    fontSize: 18,
    color: '#333',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255,255,255,0.7)',
    padding: 15,
    borderRadius: 10,
    textAlign: 'center',
    overflow: 'hidden',
    marginTop: 50,
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  subHeader: {
    fontSize: 14,
    color: '#888',
    marginBottom: 5,
    fontWeight: '600',
  },
  ingredientsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  ingredient: {
    fontSize: 14,
    marginRight: 10,
    marginBottom: 5,
  },
  haveIngredient: {
    color: '#27AE60', 
  },
  missingIngredient: {
    color: '#C0392B', 
    fontWeight: 'bold',
  },
  statusBadge: {
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  addMissingButton: {
    marginTop: 15,
    backgroundColor: '#D35400',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addMissingText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D35400', 
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    flexDirection: 'row',
  },
  menuContainer: {
    width: '75%',
    backgroundColor: '#FFF',
    height: '100%',
    paddingHorizontal: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 10,
  },
  userInfoSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileBubble: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D35400',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  menuText: {
    fontSize: 18,
    color: '#333',
    marginLeft: 15,
  },
  spacer: {
    flex: 1,
  },
  logoutButton: {
    backgroundColor: '#C0392B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 30,
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  }
});