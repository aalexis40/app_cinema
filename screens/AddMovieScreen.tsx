import React, { useState } from 'react';
import {
  View, Text, TextInput, Button, Image, StyleSheet, Alert, ScrollView,
  Keyboard, TouchableWithoutFeedback, TouchableOpacity, FlatList, Linking,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useTheme } from '../ThemeContext';

const omdbApiKey = '96ec7966';
const tmdbApiKey = 'b90effc429a5a09e911b2bb4ede65ca9';

export default function AddMovieScreen({ navigation, addMovie }: any) {
  const { theme } = useTheme();
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [director, setDirector] = useState('');
  const [genre, setGenre] = useState('');
  const [actors, setActors] = useState('');
  const [rating, setRating] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [backdrops, setBackdrops] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  const fetchMovieDetails = async (movieTitle: string) => {
    if (!movieTitle) return;
    setIsLoading(true);
    setSearchResults([]);
    setShowResults(false);

    try {
      const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(movieTitle)}&language=${language}`;
      const tmdbRes = await fetch(tmdbSearchUrl);
      const tmdbData = await tmdbRes.json();

      if (tmdbData.results?.length > 0) {
        setSearchResults(tmdbData.results);
        setShowResults(true);
      } else {
        const omdbUrl = `https://www.omdbapi.com/?apikey=${omdbApiKey}&t=${encodeURIComponent(movieTitle)}`;
        const omdbRes = await fetch(omdbUrl);
        const omdbData = await omdbRes.json();

        if (omdbData.Response === 'True') {
          setYear(omdbData.Year || '');
          setGenre(omdbData.Genre || '');
          setDirector(omdbData.Director || '');
          setActors(omdbData.Actors || '');
          setDescription(omdbData.Plot || '');
          if (omdbData.Poster && omdbData.Poster !== 'N/A') {
            setImage(omdbData.Poster);
          }
          setShowResults(false);
        } else {
          Alert.alert("Aucun film trouvé", "Vérifie le titre ou essaie un autre.");
        }
      }
    } catch (error) {
      console.error("❌ Erreur API :", error);
      Alert.alert("Erreur", "Une erreur est survenue pendant la recherche.");
    } finally {
      setIsLoading(false);
    }
  };

  const selectMovie = async (movie: any) => {
    setShowResults(false);
    setTitle(movie.title);
    setYear(movie.release_date?.split('-')[0] || '');
    setIsLoading(true);

    try {
      const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&append_to_response=credits,images,videos&language=${language}`;
      const detailsRes = await fetch(detailsUrl);
      const details = await detailsRes.json();

      setGenre(details.genres?.map((g: any) => g.name).join(', ') || '');
      const directorObj = details.credits?.crew?.find((c: any) => c.job === 'Director');
      setDirector(directorObj?.name || '');
      const mainActors = details.credits?.cast?.slice(0, 3).map((a: any) => a.name).join(', ');
      setActors(mainActors || '');
      setDescription(details.overview || '');

      if (details.poster_path) {
        setImage(`https://image.tmdb.org/t/p/w500${details.poster_path}`);
      } else {
        setImage(null);
      }

      const trailer = details.videos?.results?.find((v: any) =>
        v.type === 'Trailer' && v.site === 'YouTube'
      );
      setTrailerUrl(trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null);

      const backdropsUrls = details.images?.backdrops?.slice(0, 5).map((b: any) =>
        `https://image.tmdb.org/t/p/w500${b.file_path}`
      );
      setBackdrops(backdropsUrls || []);
    } catch (error) {
      console.error("Erreur de chargement :", error);
      Alert.alert("Erreur", "Impossible de charger les détails du film.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMovie = () => {
    if (!title || !year || !director || !genre || !actors || rating === 0) {
      Alert.alert('Erreur', 'Remplis tous les champs et attribue une note !');
      return;
    }

    const newMovie = {
      id: Date.now().toString(),
      title,
      year: parseInt(year),
      director,
      genre,
      actors: actors.split(',').map(a => a.trim()),
      rating,
      image: image || 'https://via.placeholder.com/150',
      description,
      trailerUrl,
      backdrops,
    };

    addMovie(newMovie);
    Alert.alert('Succès', 'Film ajouté ! ✅');
    navigation.navigate('MovieDetails', { movie: newMovie });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex1]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <View style={styles.flex1}>
        {showResults ? (
          <ScrollView
            style={[
              styles.resultsContainer,
              theme === 'dark' ? styles.darkContainer : styles.lightContainer,
            ]}
            keyboardShouldPersistTaps="always"
            onTouchStart={Keyboard.dismiss}
          >
            {searchResults.map((movie) => (
              <TouchableOpacity
                key={movie.id}
                onPress={() => selectMovie(movie)}
                style={[
                  styles.resultItem,
                  theme === 'dark' ? styles.darkResultItem : styles.lightResultItem,
                ]}
              >
                <Text
                  style={[
                    styles.resultTitle,
                    theme === 'dark' ? styles.darkText : styles.lightText,
                  ]}
                >
                  {movie.title} ({movie.release_date?.split('-')[0] || 'N/A'})
                </Text>
                <Text
                  style={[
                    styles.resultOverview,
                    theme === 'dark' ? styles.darkText : styles.lightText,
                  ]}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {movie.overview || 'Pas de description disponible.'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : null}
  
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              theme === 'dark' ? styles.darkContainer : styles.lightContainer,
            ]}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>
                🌍 Langue :
              </Text>
              <TouchableOpacity
                onPress={() => setLanguage(prev => (prev === 'fr' ? 'en' : 'fr'))}
                style={[styles.autoButton, { marginLeft: 10 }]}
              >
                <Text style={styles.autoButtonText}>
                  {language === 'fr' ? '🇫🇷 Français' : '🇬🇧 Anglais'}
                </Text>
              </TouchableOpacity>
            </View>
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎬 Titre :</Text>
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, styles.flexInput, theme === 'dark' ? styles.darkInput : styles.lightInput]}
                value={title}
                onChangeText={setTitle}
                placeholder="Titre du film"
                placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
              />
              <TouchableOpacity
                style={styles.autoButton}
                onPress={() => fetchMovieDetails(title)}
                disabled={isLoading || !title.trim()}
              >
                <Text style={styles.autoButtonText}>{isLoading ? '⏳...' : '🔍 Auto'}</Text>
              </TouchableOpacity>
            </View>
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>📅 Année :</Text>
            <TextInput
              style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              value={year}
              onChangeText={setYear}
              keyboardType="numeric"
              placeholder="Année de sortie"
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎭 Genre :</Text>
            <TextInput
              style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              value={genre}
              onChangeText={setGenre}
              placeholder="Genre(s) (ex: Action, Drame)"
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎬 Réalisateur :</Text>
            <TextInput
              style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              value={director}
              onChangeText={setDirector}
              placeholder="Nom du réalisateur"
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎭 Acteurs principaux :</Text>
            <TextInput
              style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              value={actors}
              onChangeText={setActors}
              placeholder="Liste des acteurs, séparés par des virgules"
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>📝 Synopsis / Description :</Text>
            <TextInput
              style={[styles.input, styles.multilineInput, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              multiline
              value={description}
              onChangeText={setDescription}
              placeholder="Description du film"
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🌐 URL de l'image principale :</Text>
            <TextInput
              style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
              value={image ?? ''}
              onChangeText={setImage}
              placeholder="https://..."
              placeholderTextColor={theme === 'dark' ? '#bbb' : '#666'}
            />
            {image && <Image source={{ uri: image }} style={styles.image} />}
  
            {backdrops.length > 0 && (
              <>
                <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎞️ Autres affiches :</Text>
                <FlatList
                  data={backdrops}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => setImage(item)}>
                      <Image
                        source={{ uri: item }}
                        style={[
                          styles.carouselImage,
                          image === item && styles.selectedImage,
                        ]}
                      />
                    </TouchableOpacity>
                  )}
                  showsHorizontalScrollIndicator={false}
                />
              </>
            )}
  
            {trailerUrl && (
              <TouchableOpacity onPress={() => Linking.openURL(trailerUrl)}>
                <Text style={[styles.trailerLink, theme === 'dark' ? styles.darkText : styles.lightText]}>
                  📺 Voir la bande-annonce
                </Text>
              </TouchableOpacity>
            )}
  
            <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>⭐ Note :</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)}>
                  <Text style={star <= rating ? styles.starSelected : styles.star}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
  
            <Button title="✅ Ajouter le Film" onPress={handleAddMovie} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </View>
    </KeyboardAvoidingView>
  );
  
  
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  lightContainer: { backgroundColor: '#fff' },
  darkContainer: { backgroundColor: '#121212' },

  label: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  lightText: { color: '#000' },
  darkText: { color: '#fff' },

  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
    fontSize: 16,
  },
  multilineInput: { height: 80, textAlignVertical: 'top' },
  lightInput: {
    backgroundColor: '#f9f9f9',
    borderColor: '#ccc',
    color: '#000',
  },
  darkInput: {
    backgroundColor: '#444',
    borderColor: '#888',
    color: '#fff',
  },

  image: { width: '100%', height: 300, resizeMode: 'contain', marginTop: 10 },

  starsContainer: { flexDirection: 'row', marginTop: 5 },
  star: { fontSize: 30, color: '#ccc', marginHorizontal: 5 },
  starSelected: { fontSize: 30, color: '#FFD700', marginHorizontal: 5 },

  inputWithButton: { flexDirection: 'row', alignItems: 'center' },
  autoButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    borderRadius: 5,
    marginLeft: 10,
  },
  autoButtonText: { color: '#fff', fontWeight: 'bold' },
  flexInput: { flex: 1 },

  trailerLink: {
    fontSize: 16,
    color: '#1E90FF',
    marginTop: 10,
    textDecorationLine: 'underline',
  },

  carouselImage: {
    width: 200,
    height: 120,
    resizeMode: 'cover',
    marginRight: 10,
    borderRadius: 8,
  },
  selectedImage: {
    borderWidth: 3,
    borderColor: '#007BFF',
  },

  resultsContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    maxHeight: 300,
    borderRadius: 8,
    borderWidth: 1,
    zIndex: 999,
    elevation: 10,  // <--- ajouté pour Android
    paddingVertical: 5,
  },
  resultItem: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  lightResultItem: { borderColor: '#ddd', backgroundColor: '#fff' },
  darkResultItem: { borderColor: '#444', backgroundColor: '#222' },

  resultTitle: { fontWeight: 'bold', fontSize: 16 },
  resultOverview: { fontSize: 14, marginTop: 3 },
});