import { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface GroceryItem {
  id: string;
  name: string;
  quantity?: string;
  isCompleted: boolean;
}

interface GroceryCategory {
  id: string;
  name: string;
  items: GroceryItem[];
}

export default function GroceriesScreen() {
  const [categories, setCategories] = useState<GroceryCategory[]>([
    {
      id: '1',
      name: 'Fruits & Vegetables',
      items: [
        { id: '1', name: 'Bananas', quantity: '6', isCompleted: false },
        { id: '2', name: 'Spinach', quantity: '1 bag', isCompleted: true },
        { id: '3', name: 'Apples', quantity: '4', isCompleted: false },
      ]
    },
    {
      id: '2',
      name: 'Dairy & Eggs',
      items: [
        { id: '4', name: 'Milk', quantity: '1 gallon', isCompleted: false },
        { id: '5', name: 'Greek Yogurt', quantity: '2 cups', isCompleted: false },
      ]
    },
    {
      id: '3',
      name: 'Frozen Foods',
      items: [
        { id: '6', name: 'Frozen Berries', quantity: '1 bag', isCompleted: true },
      ]
    }
  ]);

  const [newItemName, setNewItemName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');

  const toggleItemComplete = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            items: category.items.map(item =>
              item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
            )
          }
        : category
    ));
  };

  const addNewItem = () => {
    if (!newItemName.trim() || !selectedCategoryId) {
      Alert.alert('Error', 'Please enter an item name and select a category');
      return;
    }

    const newItem: GroceryItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      isCompleted: false
    };

    setCategories(prev => prev.map(category =>
      category.id === selectedCategoryId
        ? { ...category, items: [...category.items, newItem] }
        : category
    ));

    setNewItemName('');
    setSelectedCategoryId('');
  };

  const completedCount = categories.reduce((total, category) => 
    total + category.items.filter(item => item.isCompleted).length, 0
  );
  
  const totalCount = categories.reduce((total, category) => 
    total + category.items.length, 0
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Grocery List</Text>
        <Text style={styles.progress}>{completedCount}/{totalCount} items completed</Text>
      </View>

      <View style={styles.addItemSection}>
        <TextInput
          style={styles.textInput}
          placeholder="Add new item..."
          placeholderTextColor="#999"
          value={newItemName}
          onChangeText={setNewItemName}
        />
        <View style={styles.categorySelector}>
          {categories.map(category => (
            <Pressable
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategoryId === category.id && styles.selectedCategoryButton
              ]}
              onPress={() => setSelectedCategoryId(category.id)}
            >
              <Text style={[
                styles.categoryButtonText,
                selectedCategoryId === category.id && styles.selectedCategoryButtonText
              ]}>
                {category.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.addButton} onPress={addNewItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </Pressable>
      </View>

      {categories.map(category => (
        <View key={category.id} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          {category.items.map(item => (
            <Pressable
              key={item.id}
              style={styles.itemRow}
              onPress={() => toggleItemComplete(category.id, item.id)}
            >
              <Ionicons
                name={item.isCompleted ? "checkbox" : "square-outline"}
                size={24}
                color={item.isCompleted ? "#4CAF50" : "#fff"}
              />
              <View style={styles.itemContent}>
                <Text style={[
                  styles.itemName,
                  item.isCompleted && styles.completedItem
                ]}>
                  {item.name}
                </Text>
                {item.quantity && (
                  <Text style={styles.itemQuantity}>{item.quantity}</Text>
                )}
              </View>
            </Pressable>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#25292e',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  progress: {
    color: '#ccc',
    fontSize: 16,
  },
  addItemSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  textInput: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  categorySelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  categoryButton: {
    backgroundColor: '#444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  selectedCategoryButton: {
    backgroundColor: '#4CAF50',
  },
  categoryButtonText: {
    color: '#ccc',
    fontSize: 12,
  },
  selectedCategoryButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  categorySection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  categoryTitle: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemContent: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
  },
  completedItem: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemQuantity: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 2,
  },
});
