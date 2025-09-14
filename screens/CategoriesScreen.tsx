import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Alert,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../ThemeContext';
import Icon from 'react-native-vector-icons/Feather';

type Category = {
  id: string;
  name: string;
  movies: string[];
  image?: string;
};

const CategoriesScreen = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const navigation = useNavigation();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useFocusEffect(
    useCallback(() => {
      const loadCategories = async () => {
        try {
          const storedCategories = await AsyncStorage.getItem('categories');
          if (storedCategories) {
            setCategories(JSON.parse(storedCategories));
          }
        } catch (error) {
          console.error('Erreur lors du chargement des catégories:', error);
        }
      };

      loadCategories();
    }, [])
  );

  const saveCategories = async (updated: Category[]) => {
    setCategories(updated);
    await AsyncStorage.setItem('categories', JSON.stringify(updated));
  };

  // Création d'une nouvelle catégorie
  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      alert('Veuillez entrer un nom pour la catégorie');
      return;
    }

    const newCategory: Category = {
      id: Math.random().toString(),
      name: newCategoryName.trim(),
      movies: [],
    };

    const updatedCategories = [...categories, newCategory];
    await saveCategories(updatedCategories);
    setNewCategoryName('');
    setCreateModalVisible(false);
  };

  // Renommer catégorie
  const renameCategory = async (category: Category, newName: string) => {
    const updated = categories.map((c) =>
      c.id === category.id ? { ...c, name: newName } : c
    );
    await saveCategories(updated);
  };

  // Supprimer catégorie
  const deleteCategory = async (id: string) => {
    Alert.alert(
      'Confirmation',
      'Supprimer cette catégorie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const updated = categories.filter((c) => c.id !== id);
            await saveCategories(updated);
          },
        },
      ]
    );
  };

  // Ajouter une image à la catégorie
  const pickImage = async (category: Category) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
      base64: false,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const updated = categories.map((c) =>
        c.id === category.id ? { ...c, image: result.assets[0].uri } : c
      );
      await saveCategories(updated);
    }
  };

  // Ouvrir menu options catégorie
  const openCategoryOptions = (category: Category) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setModalVisible(true);
  };

  // Rendu d'une catégorie
  const renderCategory = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}
      onPress={() => navigation.navigate('CategoryDetailsScreen', { categoryId: item.id })}
    >
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.image} />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={{ color: '#888' }}>Aucune image</Text>
        </View>
      )}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: isDark ? '#fff' : '#000' }]}>{item.name}</Text>
        <TouchableOpacity onPress={() => openCategoryOptions(item)}>
          <Icon name="more-vertical" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Renommer depuis modal
  const handleRename = () => {
    if (selectedCategory && newCategoryName.trim()) {
      renameCategory(selectedCategory, newCategoryName.trim());
      setModalVisible(false);
      setNewCategoryName('');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#f0f0f0' }]}>

      <FlatList
        data={categories}
        keyExtractor={(item) => item.id}
        renderItem={renderCategory}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Bouton flottant + */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#4CAF50' }]}
        onPress={() => setCreateModalVisible(true)}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal options catégorie (rename, image, supprimer) */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Modifier la catégorie</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ccc',
                },
              ]}
              placeholder="Nouveau nom"
              placeholderTextColor={isDark ? '#aaa' : '#666'}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <TouchableOpacity onPress={handleRename} style={[styles.modalButton, { backgroundColor: '#2196F3' }]}>
              <Text style={styles.buttonText}>Renommer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (selectedCategory) pickImage(selectedCategory);
              }}
              style={[styles.modalButton, { backgroundColor: '#FFC107' }]}
            >
              <Text style={styles.buttonText}>Changer l'image</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (selectedCategory) deleteCategory(selectedCategory.id);
                setModalVisible(false);
              }}
              style={[styles.modalButton, { backgroundColor: '#f44336' }]}
            >
              <Text style={styles.buttonText}>Supprimer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={{ marginTop: 10, color: '#888', textAlign: 'center' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal création catégorie */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1e1e1e' : '#fff' }]}>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>Créer une catégorie</Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? '#2a2a2a' : '#f9f9f9',
                  color: isDark ? '#fff' : '#000',
                  borderColor: isDark ? '#444' : '#ccc',
                },
              ]}
              placeholder="Nom de la catégorie"
              placeholderTextColor={isDark ? '#aaa' : '#666'}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />

            <TouchableOpacity onPress={createCategory} style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}>
              <Text style={styles.buttonText}>Créer</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
              <Text style={{ marginTop: 10, color: '#888', textAlign: 'center' }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  card: {
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  image: {
    height: 160,
    width: '100%',
  },
  placeholderImage: {
    height: 160,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalButton: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    height: 56,
    width: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
  },
  fabText: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 36,
    fontWeight: 'bold',
  },
});

export default CategoriesScreen;
