import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ImageBackground, 
  Modal, 
  TouchableWithoutFeedback,
  FlatList,
  Alert
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebaseConfig';
import { signOut } from 'firebase/auth';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

import AddPantryItemModal from '../components/AddPantryItemModal';
import PantryItemCard from '../components/PantryItemCard';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [menuVisible, setMenuVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pantryItems, setPantryItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null); 
  
  const userEmail = auth.currentUser?.email || 'Guest';
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'pantry'), where('userId', '==', userId));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const items = [];
      querySnapshot.forEach((doc) => {
        items.push({ ...doc.data(), id: doc.id });
      });
      setPantryItems(items);
    });

    return () => unsubscribe();
  }, []);

  const handleAddItem = async (newItem) => {
    try {
      await addDoc(collection(db, 'pantry'), {
        ...newItem,
        userId: userId
      });
    } catch (error) {
      Alert.alert('Error', 'Could not add item: ' + error.message);
    }
  };

  const handleUpdateItem = async (id, updatedData) => {
    try {
      const itemRef = doc(db, 'pantry', id);
      await updateDoc(itemRef, updatedData);
    } catch (error) {
      Alert.alert('Error', 'Could not update item: ' + error.message);
    }
  };

  const handleDeleteItem = async (id) => {
    try {
      await deleteDoc(doc(db, 'pantry', id));
    } catch (error) {
      Alert.alert('Error', 'Could not delete item');
    }
  };

  const onEditPress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const onAddPress = () => {
    setSelectedItem(null);
    setModalVisible(true);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    signOut(auth).then(() => navigation.replace('Login'));
  };

  const navigateTo = (screenName) => {
    setMenuVisible(false);
    navigation.navigate(screenName);
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
          <Text style={styles.headerTitle}>My Pantry</Text>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.contentContainer}>
          {pantryItems.length === 0 ? (
            <Text style={styles.placeholderText}>Your pantry is empty!</Text>
          ) : (
            <FlatList 
              data={pantryItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PantryItemCard 
                  item={item} 
                  onDelete={handleDeleteItem} 
                  onPress={onEditPress} 
                />
              )}
              style={{ width: '100%' }}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <TouchableOpacity 
          style={styles.fab} 
          onPress={onAddPress}
        >
          <Ionicons name="add" size={32} color="white" />
        </TouchableOpacity>

        <AddPantryItemModal 
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

                <TouchableOpacity style={styles.menuItem} onPress={() => setMenuVisible(false)}>
                  <Ionicons name="home-outline" size={24} color="#333" />
                  <Text style={styles.menuText}>My Pantry</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('Grocery')}>
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#D35400',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center', 
    alignItems: 'center', 
  },
  placeholderText: {
    fontSize: 18,
    color: 'black',
    fontStyle: 'italic',
    fontWeight: '600',
    backgroundColor: 'rgba(255,255,255,0.7)', 
    padding: 10,
    borderRadius: 10,
    overflow: 'hidden'
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