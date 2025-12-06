import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert, 
  ImageBackground,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { db, auth } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

import AddGroceryItemModal from '../components/AddGroceryItemModal';

export default function GroceryScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const userEmail = auth.currentUser?.email || 'Guest';

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null); 
  const [groceryList, setGroceryList] = useState([]);
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

    const q = query(collection(db, 'grocery'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      items.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
      setGroceryList(items);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async (itemData) => {
    try {
      await addDoc(collection(db, 'grocery'), {
        ...itemData,
        userId: userId,
      });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleUpdateItem = async (id, updatedData) => {
    try {
      await updateDoc(doc(db, 'grocery', id), updatedData);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const toggleComplete = async (id, currentStatus) => {
    try {
      await updateDoc(doc(db, 'grocery', id), {
        completed: !currentStatus
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  const deleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'grocery', id));
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const moveToPantry = async (item) => {
    try {
      await addDoc(collection(db, 'pantry'), {
        name: item.name,
        quantity: 1, 
        amount: item.amount, 
        unit: item.unit,     
        category: item.category || 'Other',
        notes: item.notes || '',
        expiryDate: new Date().toISOString().split('T')[0], 
        userId: userId,
        createdAt: new Date()
      });

      await deleteDoc(doc(db, 'grocery', item.id));
      Alert.alert('Moved!', `${item.name} is now in your Pantry.`);
    } catch (error) {
      Alert.alert('Error', 'Could not move item.');
    }
  };

  const openAdd = () => {
    setSelectedItem(null);
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <TouchableOpacity 
        style={styles.checkboxContainer} 
        onPress={() => toggleComplete(item.id, item.completed)}
      >
        <Ionicons 
          name={item.completed ? "checkbox" : "square-outline"} 
          size={28} 
          color={item.completed ? "#27AE60" : "#666"} 
        />
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.textContainer}
        onPress={() => openEdit(item)}
      >
        <Text style={[styles.itemName, item.completed && styles.checkedText]}>
          {item.name}
        </Text>
        <Text style={styles.itemDetails}>
          {item.amount} {item.unit} • {item.category}
        </Text>
        {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
      </TouchableOpacity>

      {item.completed && (
        <TouchableOpacity style={styles.moveButton} onPress={() => moveToPantry(item)}>
          <Ionicons name="arrow-up-circle" size={32} color="#D35400" />
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => deleteItem(item.id)} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={24} color="#999" />
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Grocery List</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.contentContainer}>
          {groceryList.length === 0 ? (
            <Text style={styles.placeholderText}>Your shopping list is empty!</Text>
          ) : (
            <FlatList
              data={groceryList}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          )}
        </View>

        <TouchableOpacity style={styles.fab} onPress={openAdd}>
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <AddGroceryItemModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onAdd={handleAddItem}
          onUpdate={handleUpdateItem}
          itemToEdit={selectedItem}
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

                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Ionicons name="cart-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>Grocery List</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Recipes')}>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkboxContainer: {
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  itemDetails: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  itemNotes: {
    fontSize: 12,
    color: '#D35400',
    marginTop: 2,
    fontStyle: 'italic',
  },
  checkedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  moveButton: {
    marginRight: 10,
    padding: 5,
  },
  deleteButton: {
    padding: 5,
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