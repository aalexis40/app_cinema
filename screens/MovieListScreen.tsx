import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  TextInput,
  Alert,
  Modal,
  Switch,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';
import { Swipeable } from 'react-native-gesture-handler';
import TextTicker from 'react-native-text-ticker';

const OMDB_API_KEY = '96ec7966';

export default function MovieListScreen({ navigation }: any) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('title-asc');
  const [modalVisible, setModalVisible] = useState(false);
  const [useOMDb, setUseOMDb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [omdbPage, setOmdbPage] = useState(1);
  const [omdbQuery, setOmdbQuery] = useState('');
  const { theme } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    if (!useOMDb) {
      const loadMovies = async () => {
        try {
          const storedMovies = await AsyncStorage.getItem('movies');
          if (storedMovies) {
            const parsed = JSON.parse(storedMovies);
            if (Array.isArray(parsed)) {
              setMovies(parsed);
            }
          }
        } catch (error) {
          console.error('Erreur lors du chargement des films:', error);
        }
      };
      loadMovies();
    } else {
      if (omdbQuery) fetchOMDbMovies(omdbQuery, 1, false);
    }
  }, [navigation, useOMDb]);

  const fetchOMDbMovies = async (query = '', page = 1, append = false) => {
    if (!query) return;

    setLoading(true);
    try {
      const response = await fetch(
        `https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await response.json();

      if (data.Response === 'True') {
        const results = data.Search || [];

        const detailedMovies = await Promise.all(
          results.map(async (item: any) => {
            const detailsRes = await fetch(`https://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=short`);
            const details = await detailsRes.json();
            return {
              id: details.imdbID,
              title: details.Title,
              year: parseInt(details.Year),
              director: details.Director || 'Inconnu',
              genre: details.Genre || 'Inconnu',
              image: details.Poster !== 'N/A' ? details.Poster : undefined,
              actors: details.Actors ? details.Actors.split(',').map((a: string) => a.trim()) : [],
            };
          })
        );

        const tmdbMovies = await fetchTMDbMovies(query, page);

        // Fusionner les deux, sans doublons (par id)
        const combinedMovies = Array.from(
          new Map([...detailedMovies, ...tmdbMovies].map((m) => [m.id, m])).values()
        );
        
        setMovies(prev =>
          append
            ? Array.from(new Map([...prev, ...combinedMovies].map(m => [m.id, m])).values())
            : combinedMovies
        );
        

        setOmdbPage(page);
      } else {
        if (!append) setMovies([]);
      }
    } catch (error) {
      console.error('Erreur OMDb:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTMDbMovies = async (query = '', page = 1) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=b90effc429a5a09e911b2bb4ede65ca9&language=fr-FR&query=${encodeURIComponent(query)}&page=${page}`
      );
      const data = await response.json();
  
      if (data.results) {
        const detailedMovies = data.results.map((item: any) => ({
          id: `tmdb-${item.id}`,
          title: item.title || 'Sans titre',
          year: item.release_date ? parseInt(item.release_date.split('-')[0]) : 0,
          director: 'Inconnu (TMDb)', // Pas dispo dans search
          genre: 'Inconnu',
          image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : undefined,
          actors: [],
        }));
        return detailedMovies;
      }
    } catch (err) {
      console.error('Erreur TMDb:', err);
    }
    return [];
  };
  
  const saveMovieLocally = async (movie: Movie) => {
    try {
      const stored = await AsyncStorage.getItem('movies');
      const existing = stored ? JSON.parse(stored) : [];
      const updated = [...existing, movie];
      await AsyncStorage.setItem('movies', JSON.stringify(updated));
      Alert.alert('Succès', 'Film enregistré localement.');
    } catch (err) {
      Alert.alert('Erreur', 'Impossible d’enregistrer le film.');
    }
  };

  const deleteMovie = async (movieId: string) => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment supprimer ce film ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMovies = movies.filter(movie => movie.id !== movieId);
              setMovies(updatedMovies);
              await AsyncStorage.setItem('movies', JSON.stringify(updatedMovies));
            } catch (error) {
              console.error('Erreur lors de la suppression :', error);
            }
          },
        },
      ]
    );
  };

  const getSortedMovies = () => {
    let sorted = [...movies];
    switch (sortOption) {
      case 'year-asc':
        sorted.sort((a, b) => a.year - b.year);
        break;
      case 'year-desc':
        sorted.sort((a, b) => b.year - a.year);
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'director':
        sorted.sort((a, b) => a.director.localeCompare(b.director));
        break;
    }
    return sorted;
  };

  const filteredMovies = useOMDb
    ? movies
    : getSortedMovies().filter(movie => {
        const query = searchQuery.toLowerCase();
        return (
          movie.title.toLowerCase().includes(query) ||
          movie.director.toLowerCase().includes(query) ||
          movie.genre.toLowerCase().includes(query) ||
          (movie.actors && movie.actors.some(actor => actor.toLowerCase().includes(query)))
        );
      });

  return (
    <View style={[styles.container, theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchBar, theme === 'dark' ? styles.darkSearchBar : styles.lightSearchBar]}
          placeholder="🔎 Rechercher un film..."
          placeholderTextColor={theme === 'dark' ? '#ccc' : '#555'}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            if (useOMDb) {
              setOmdbQuery(text);
              fetchOMDbMovies(text, 1, false);
            }
          }}
        />
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.sortButton}>
          <Text style={styles.sortButtonText}>⇅</Text>
        </TouchableOpacity>
        <Switch value={useOMDb} onValueChange={(val) => {
          setUseOMDb(val);
          setMovies([]);
          setSearchQuery('');
          setOmdbQuery('');
        }} />
      </View>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalContainer} onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Trier par :</Text>
            {['year-desc', 'year-asc', 'title-asc', 'title-desc', 'director'].map(value => (
              <TouchableOpacity key={value} onPress={() => {
                setSortOption(value);
                setModalVisible(false);
              }}>
                <Text style={styles.modalOption}>{value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {loading && <ActivityIndicator size="large" color="#007BFF" style={{ margin: 20 }} />}

      <FlatList
        data={filteredMovies}
        keyExtractor={(item, index) => item.id || `movie-${index}`}
        numColumns={isLandscape ? 3 : 1}
        key={isLandscape ? 'h' : 'v'} // forcer rerender quand orientation change
        renderItem={({ item: movie, index }) => (
          <Swipeable
            renderRightActions={() => !useOMDb && (
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteMovie(movie.id)}>
                <Text style={styles.deleteText}>Supprimer</Text>
              </TouchableOpacity>
            )}
          >
            <TouchableOpacity
              style={[
                styles.movieRow,
                isLandscape ? styles.movieRowLandscape : null,
                theme === 'dark' ? styles.darkMovieRow : styles.lightMovieRow
              ]}
              onPress={() => navigation.navigate('MovieDetails', { movie, fromExternal: useOMDb })}
              onLongPress={() => useOMDb && saveMovieLocally(movie)}
            >
              <Text style={[styles.indexNumber, theme === 'dark' ? styles.darkText : styles.lightText]}>
                {index + 1}.
              </Text>

              {movie.image ? (
                <Image
                  source={{ uri: movie.image }}
                  style={[styles.movieImage, isLandscape ? styles.movieImageLandscape : null]}
                />
              ) : (
                <Text style={styles.noImageText}>Pas d'image</Text>
              )}

              <View style={{ flex: 1, flexShrink: 1 }}>
                <TextTicker
                  style={[styles.movieTitle, theme === 'dark' ? styles.darkText : styles.lightText]}
                  duration={6000}
                  loop
                  bounce
                  repeatSpacer={50}
                  marqueeDelay={1000}
                  scrollSpeed={50}
                >
                  {movie.title} ({movie.year})
                </TextTicker>

                <Text
                  style={[styles.movieDetails, theme === 'dark' ? styles.darkText : styles.lightText]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  🎭 {movie.genre} - 🎬 {movie.director}
                </Text>
              </View>
            </TouchableOpacity>
          </Swipeable>
        )}
        onEndReached={() => {
          if (useOMDb && omdbQuery) {
            fetchOMDbMovies(omdbQuery, omdbPage + 1, true);
          }
        }}
        onEndReachedThreshold={0.5}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />


      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddMovie')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  lightContainer: { backgroundColor: '#f9f9f9' },
  darkContainer: { backgroundColor: '#121212' },

  // Barre du haut : recherche + tri + switch OMDb
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    borderWidth: 1,
  },
  lightSearchBar: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    color: '#000',
  },
  darkSearchBar: {
    backgroundColor: '#2a2a2a',
    borderColor: '#444',
    color: '#fff',
  },

  sortButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 10,
  },
  sortButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Ligne de film - mode portrait
  movieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    marginVertical: 6,
    gap: 10,
  },
  // Ligne de film - mode paysage (horizontal)
  movieRowLandscape: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 10,
  },

  lightMovieRow: {
    backgroundColor: '#fff',
    borderColor: '#ddd',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  darkMovieRow: {
    backgroundColor: '#1e1e1e',
    borderColor: '#333',
    borderWidth: 1,
  },

  movieImage: {
    width: 70,
    height: 100,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  movieImageLandscape: {
    width: 120,
    height: 170,
    marginBottom: 8,
    alignSelf: 'center',
  },
  noImageText: {
    color: '#999',
    width: 70,
    height: 100,
    textAlign: 'center',
    textAlignVertical: 'center',
    borderRadius: 8,
    backgroundColor: '#ccc',
  },

  movieTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieDetails: {
    fontSize: 14,
    color: '#888',
  },
  lightText: { color: '#000' },
  darkText: { color: '#fff' },

  indexNumber: {
    width: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 13,
    color: '#888',
  },

  separator: {
    height: 8,
  },

  deleteButton: {
    backgroundColor: 'crimson',
    justifyContent: 'center',
    alignItems: 'center',
    width: 90,
    height: '100%',
    borderRadius: 16,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
    padding: 10,
  },

  // Modal de tri
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    width: '80%',
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalOption: {
    fontSize: 18,
    marginVertical: 8,
    color: '#007BFF',
  },

  // Bouton flottant pour ajouter un film
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007BFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#fff',
  },
});
