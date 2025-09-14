import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';

const { width } = Dimensions.get('window');

export default function MovieDetailsScreen({ route, navigation }) {
  const { movie, fromExternal } = route.params || {};
  const { theme } = useTheme();

  if (!movie) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Aucune information sur ce film.</Text>
      </View>
    );
  }

  // Détermine si le film vient d'une source externe (OMDb ou TMDb)
  const isExternalMovie = !!fromExternal;

  const deleteMovie = async () => {
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
              const storedMovies = await AsyncStorage.getItem('movies');
              if (storedMovies) {
                const movies = JSON.parse(storedMovies);
                const updatedMovies = movies.filter((m) => m.id !== movie.id);
                await AsyncStorage.setItem('movies', JSON.stringify(updatedMovies));
                navigation.popToTop();
              }
            } catch (error) {
              console.error('Erreur lors de la suppression :', error);
            }
          },
        },
      ]
    );
  };

  // Fonction pour ajouter un film externe à la collection locale
  const addToCollection = async () => {
    try {
      const storedMovies = await AsyncStorage.getItem('movies');
      const movies = storedMovies ? JSON.parse(storedMovies) : [];

      // On vérifie si le film est déjà dans la collection pour éviter doublons
      if (movies.some((m) => m.id === movie.id)) {
        Alert.alert('Info', 'Ce film est déjà dans votre collection.');
        return;
      }

      movies.push(movie);
      await AsyncStorage.setItem('movies', JSON.stringify(movies));
      Alert.alert('Succès', 'Film ajouté à votre collection.');
      navigation.popToTop();
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la collection :', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter le film à la collection.');
    }
  };

  const renderStars = (rating) => {
    const fullStars = '⭐'.repeat(Math.floor(rating));
    const emptyStars = '☆'.repeat(5 - Math.floor(rating));
    return fullStars + emptyStars;
  };

  const themedCard = theme === 'dark' ? styles.cardDark : styles.cardLight;
  const themedText = theme === 'dark' ? styles.textDark : styles.textLight;

  return (
    <ScrollView
      style={[styles.container, theme === 'dark' ? styles.darkContainer : styles.lightContainer]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, themedText]}>
        {movie.title} ({movie.year})
      </Text>

      <AnimatePresence>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0 }}
          style={themedCard}
        >
          {movie.image ? (
            <Image source={{ uri: movie.image }} style={styles.movieImage} />
          ) : (
            <Text style={styles.noImageText}>Pas d'image disponible</Text>
          )}
        </MotiView>
      </AnimatePresence>

      {[
        { label: '🎬 Réalisateur', value: movie.director },
        { label: '🎭 Genre', value: movie.genre },
        { label: '👥 Acteurs', value: movie.actors?.join(', ') },
        { label: '📝 Synopsis', value: movie.description },
      ].map((section, index) => (
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 * (index + 1) }}
          key={index}
          style={themedCard}
        >
          <Text style={[styles.sectionTitle, themedText]}>{section.label} :</Text>
          <Text style={[styles.detailText, themedText]}>
            {section.value || 'Non spécifié'}
          </Text>
        </MotiView>
      ))}

      {movie.trailerUrl && (
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={themedCard}>
          <Text style={[styles.sectionTitle, themedText]}>📺 Bande-annonce :</Text>
          <View style={styles.trailerContainer}>
            <WebView
              source={{ uri: movie.trailerUrl }}
              style={styles.webview}
              javaScriptEnabled
              domStorageEnabled
              allowsFullscreenVideo
            />
          </View>
        </MotiView>
      )}

      <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} style={themedCard}>
        <Text style={[styles.sectionTitle, themedText]}>⭐ Note :</Text>
        <Text style={[styles.detailText, themedText]}>{renderStars(movie.rating)}</Text>
      </MotiView>

      <View style={styles.buttonContainer}>
        {isExternalMovie ? (
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={addToCollection}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.buttonText}>Ajouter à ma collection</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => navigation.navigate('EditMovie', { movie })}
              activeOpacity={0.7}
            >
              <Ionicons name="pencil" size={20} color="#fff" />
              <Text style={styles.buttonText}>Modifier</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={deleteMovie}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={20} color="#fff" />
              <Text style={styles.buttonText}>Supprimer</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  lightContainer: { backgroundColor: '#FAFAFA' },
  darkContainer: { backgroundColor: '#121212' },

  title: {
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },

  textLight: { color: '#222' },
  textDark: { color: '#E0E0E0' },

  errorText: { fontSize: 18, color: 'red', textAlign: 'center', marginTop: 20 },

  cardLight: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardDark: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },

  detailText: {
    fontSize: 16,
    lineHeight: 24,
  },

  movieImage: {
    width: '100%',
    height: width * 0.6,
    borderRadius: 12,
    resizeMode: 'cover',
  },

  noImageText: {
    textAlign: 'center',
    fontSize: 16,
    color: 'gray',
  },

  trailerContainer: {
    height: 220,
    marginTop: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },

  webview: {
    flex: 1,
  },

  buttonContainer: {
    marginTop: 30,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  editButton: {
    backgroundColor: '#1976D2',
  },
  deleteButton: {
    backgroundColor: '#D32F2F',
  },
  addButton: {
    backgroundColor: '#388E3C',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
