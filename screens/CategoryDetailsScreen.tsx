import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { useNavigation, useRoute, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';

type Movie = {
  id: string;
  title: string;
  year: number;
  director: string;
  genre: string;
  actors: string[];          // <-- Ajout des acteurs principaux
  image?: string;
};

type Category = {
  id: string;
  name: string;
  movies: string[];
};

const CategoryDetailsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { categoryId } = route.params as { categoryId: string };

  const [category, setCategory] = useState<Category | null>(null);
  const [allMovies, setAllMovies] = useState<Movie[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchText, setSearchText] = useState('');

  const loadMovies = async () => {
    try {
      const storedMovies = await AsyncStorage.getItem('movies');
      if (storedMovies) {
        const parsedMovies: Movie[] = JSON.parse(storedMovies);
        setAllMovies(parsedMovies);
      }
    } catch (error) {
      console.error('Erreur de chargement des films:', error);
    }
  };

  const loadCategory = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      if (storedCategories) {
        const parsedCategories: Category[] = JSON.parse(storedCategories);
        const categoryData = parsedCategories.find((cat) => cat.id === categoryId);
        if (categoryData) {
          setCategory(categoryData);
        }
      }
    } catch (error) {
      console.error('Erreur de chargement de la catégorie:', error);
    }
  };

  const saveCategory = async (updatedCategory: Category) => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      if (storedCategories) {
        const parsedCategories: Category[] = JSON.parse(storedCategories);
        const updatedCategories = parsedCategories.map((cat) =>
          cat.id === updatedCategory.id ? updatedCategory : cat
        );
        await AsyncStorage.setItem('categories', JSON.stringify(updatedCategories));
        setCategory(updatedCategory);
      }
    } catch (error) {
      console.error('Erreur de sauvegarde des catégories:', error);
    }
  };

  useEffect(() => {
    loadMovies();
    loadCategory();
  }, []);

  const addMovieToCategory = (movieId: string) => {
    if (category && !category.movies.includes(movieId)) {
      const updatedCategory = {
        ...category,
        movies: [...category.movies, movieId],
      };
      saveCategory(updatedCategory);
    }
    setShowModal(false);
    setSearchText('');
  };

  const handleShowModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSearchText('');
  };

  const deleteMovieFromCategory = (movieId: string) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce film de cette catégorie ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            if (category) {
              const updatedMovies = category.movies.filter((id) => id !== movieId);
              const updatedCategory = { ...category, movies: updatedMovies };
              saveCategory(updatedCategory);
            }
          },
        },
      ]
    );
  };

  const renderRightActions = (movieId: string) => {
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteMovieFromCategory(movieId)}
      >
        <Text style={styles.deleteText}>Supprimer</Text>
      </TouchableOpacity>
    );
  };

  const renderMovieItem = (item: Movie) => (
    <Swipeable renderRightActions={() => renderRightActions(item.id)}>
      <TouchableOpacity
        style={[styles.movieRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => navigation.navigate('MovieDetails', { movie: item })}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.movieImage} />
        ) : (
          <Text style={[styles.noImageText, { color: colors.text }]}>Pas d'image</Text>
        )}
        <View>
          <Text style={[styles.movieTitle, { color: colors.text }]}>
            {item.title} ({item.year})
          </Text>
          <Text style={[styles.movieDetails, { color: colors.text }]}>
            🎭 {item.genre} - 🎬 {item.director}
          </Text>
          <Text style={[styles.movieDetails, { color: colors.text, fontStyle: 'italic' }]}>
            👥 {item.actors.join(', ')}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );

  // Filtrage des films dans la modal d'ajout selon titre, réalisateur, genre et acteurs
  const filteredMoviesForAdd = allMovies
  .filter((movie) => {
    if (!category) return false;
    if (category.movies.includes(movie.id)) return false;
    const lowerSearch = searchText.toLowerCase();
    return (
      movie.title.toLowerCase().includes(lowerSearch) ||
      movie.director.toLowerCase().includes(lowerSearch) ||
      movie.genre.toLowerCase().includes(lowerSearch) ||
      movie.actors.some((actor) => actor.toLowerCase().includes(lowerSearch))
    );
  })
  .sort((a, b) => a.title.localeCompare(b.title));


  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {category ? (
        <>
          <Text style={[styles.title, { color: colors.text }]}>{category.name}</Text>

          <TouchableOpacity
            style={[styles.fab, { backgroundColor: '#4CAF50' }]}
            onPress={handleShowModal}
            activeOpacity={0.7}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>

          <FlatList
            data={allMovies.filter((movie) => category.movies.includes(movie.id))}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderMovieItem(item)}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            contentContainerStyle={{ paddingBottom: 100 }}
          />

          <Modal visible={showModal} animationType="slide" onRequestClose={handleCloseModal}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}></Text>

              <TextInput
                style={[styles.searchInput, { color: colors.text, borderColor: colors.border }]}
                placeholder="Rechercher par titre, réalisateur, genre ou acteur"
                placeholderTextColor={colors.text + '99'}
                value={searchText}
                onChangeText={setSearchText}
              />

              <FlatList
                data={filteredMoviesForAdd}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.movieRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => addMovieToCategory(item.id)}
                  >
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.movieImage} />
                    ) : (
                      <Text style={[styles.noImageText, { color: colors.text }]}>Pas d'image</Text>
                    )}
                    <View>
                      <Text style={[styles.movieTitle, { color: colors.text }]}>
                        {item.title} ({item.year})
                      </Text>
                      <Text style={[styles.movieDetails, { color: colors.text }]}>
                        🎭 {item.genre} - 🎬 {item.director}
                      </Text>
                      <Text style={[styles.movieDetails, { color: colors.text, fontStyle: 'italic' }]}>
                        👥 {item.actors.join(', ')}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
              />

              <Button title="Fermer" onPress={handleCloseModal} />
            </View>
          </Modal>
        </>
      ) : (
        <Text style={{ color: colors.text }}>Chargement de la catégorie...</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    borderRadius: 4,
    marginBottom: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  movieRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
  },
  movieImage: {
    width: 50,
    height: 70,
    resizeMode: 'cover',
    borderRadius: 5,
    marginRight: 10,
  },
  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  movieDetails: {
    fontSize: 14,
  },
  noImageText: {
    marginRight: 10,
  },
  separator: {
    height: 1,
    marginVertical: 5,
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 16,
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
    zIndex: 10,
  },
  fabText: {
    color: '#fff',
    fontSize: 36,
    lineHeight: 36,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 12,
    marginVertical: 6,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
});

export default CategoryDetailsScreen;
