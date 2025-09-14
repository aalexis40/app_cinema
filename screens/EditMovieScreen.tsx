import React, { useState } from 'react';
import { 
  View, Text, TextInput, Button, StyleSheet, Alert, ScrollView, 
  TouchableWithoutFeedback, Keyboard, TouchableOpacity, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../ThemeContext';

export default function EditMovieScreen({ route, navigation }: any) {
  const { movie } = route.params;
  const { theme } = useTheme();

  // Initial images = l’image du film s’il y en a, sinon tableau vide
  const [images, setImages] = useState([movie.image].filter(Boolean));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Nouvelle state pour url saisie manuellement
  const [manualImageUrl, setManualImageUrl] = useState(movie.image || '');

  const [title, setTitle] = useState(movie.title);
  const [year, setYear] = useState(movie.year.toString());
  const [director, setDirector] = useState(movie.director);
  const [genre, setGenre] = useState(movie.genre);
  const [actors, setActors] = useState(movie.actors.join(', '));
  const [rating, setRating] = useState(movie.rating);
  
  // Ajout du state description
  const [description, setDescription] = useState(movie.description || '');
  // Nouvelle propriété pour la bande-annonce
  const [trailerUrl, setTrailerUrl] = useState(movie.trailerUrl || '');

  const tmdbApiKey = 'b90effc429a5a09e911b2bb4ede65ca9';


  const fetchMovieImagesMultilang = async () => {
    try {
      const queryTitle = title.trim();

      const languages = ['fr-FR', 'en-US'];
      let allImages: string[] = [];

      for (const lang of languages) {
        const tmdbSearchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(queryTitle)}&year=${year}&language=${lang}`;
        const res = await fetch(tmdbSearchUrl);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          data.results.forEach((movieResult: any) => {
            if (movieResult.poster_path) {
              const posterFullUrl = `https://image.tmdb.org/t/p/w500${movieResult.poster_path}`;
              if (!allImages.includes(posterFullUrl)) {
                allImages.push(posterFullUrl);
              }
            }
          });
        }
      }

      if (allImages.length === 0) {
        Alert.alert('Aucune image trouvée', 'TMDb n\'a retourné aucune affiche pour ce film.');
      } else {
        setImages(allImages);
        setCurrentIndex(0);
        setManualImageUrl(allImages[0]); // met à jour champ url aussi
      }
    } catch (error) {
      console.error("Erreur pendant la recherche d'affiche :", error);
      Alert.alert('Erreur', 'Impossible de récupérer les images du film.');
    }
  };
  const fetchTrailerUrl = async () => {
    try {
      const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${tmdbApiKey}&query=${encodeURIComponent(title)}&year=${year}`;
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        return Alert.alert("Aucun film trouvé", "Impossible de trouver une correspondance pour ce titre.");
      }

      const movieId = searchData.results[0].id;

      const videoUrl = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${tmdbApiKey}`;
      const videoResponse = await fetch(videoUrl);
      const videoData = await videoResponse.json();

      const trailer = videoData.results.find(
        (v: any) => v.site === "YouTube" && v.type === "Trailer"
      );

      if (trailer) {
        const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        setTrailerUrl(youtubeUrl);
        Alert.alert("✅ Bande-annonce trouvée", youtubeUrl);
      } else {
        Alert.alert("Aucune bande-annonce", "Aucune vidéo de type 'Trailer' n'a été trouvée.");
      }
    } catch (error) {
      console.error("Erreur trailer:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la récupération de la bande-annonce.");
    }
  };

  // Quand utilisateur modifie manuellement l'url, on met à jour images et currentIndex
  const onManualImageUrlChange = (url: string) => {
    setManualImageUrl(url);
    if (url) {
      setImages([url]);
      setCurrentIndex(0);
    } else {
      setImages([]);
      setCurrentIndex(0);
    }
  };

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    setManualImageUrl(images[(currentIndex + 1) % images.length]);
  };
  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    setManualImageUrl(images[(currentIndex - 1 + images.length) % images.length]);
  };

  const handleUpdateMovie = async () => {
    try {
      const storedMovies = await AsyncStorage.getItem('movies');
      let movies = storedMovies ? JSON.parse(storedMovies) : [];

      const updatedMovies = movies.map(m =>
        m.id === movie.id
          ? { 
              ...m, 
              image: images[currentIndex], 
              title, 
              year: parseInt(year), 
              director, 
              genre, 
              actors: actors.split(',').map(a => a.trim()), 
              rating,
              description, // sauvegarde du synopsis modifié
              trailerUrl, // <-- ici

            }
          : m
      );

      await AsyncStorage.setItem('movies', JSON.stringify(updatedMovies));

      Alert.alert("Succès", "Film mis à jour !");
      navigation.reset({
        index: 1,
        routes: [
          { name: 'MovieList' },
          { name: 'MovieDetails', params: { movie: { 
            ...movie, 
            image: images[currentIndex], 
            title, 
            year: parseInt(year), 
            director, 
            genre, 
            actors: actors.split(',').map(a => a.trim()), 
            rating,
            description,
            trailerUrl, // <-- ici

          } } }
        ],
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour :", error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView contentContainerStyle={[styles.container, theme === 'dark' ? styles.darkContainer : styles.lightContainer]}>

        {/* Champ saisie URL manuelle */}
        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>📷 URL de l'image :</Text>
        <TextInput 
          style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} 
          value={manualImageUrl} 
          onChangeText={onManualImageUrlChange} 
          placeholder="https://..." 
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Carousel */}
        {images.length > 0 ? (
          <View style={styles.carouselContainer}>
            <TouchableOpacity onPress={prevImage} style={styles.navButton}>
              <Text style={styles.navButtonText}>‹</Text>
            </TouchableOpacity>

            <Image source={{ uri: images[currentIndex] }} style={styles.movieImage} />

            <TouchableOpacity onPress={nextImage} style={styles.navButton}>
              <Text style={styles.navButtonText}>›</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>Aucune image</Text>
          </View>
        )}

        <Button title="🔍 Recherche d'images multi-langues (TMDb)" onPress={fetchMovieImagesMultilang} />

        {/* Autres champs */}
        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎬 Titre :</Text>
        <TextInput style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} value={title} onChangeText={setTitle} />

        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>📅 Année :</Text>
        <TextInput style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} value={year} onChangeText={setYear} keyboardType="numeric" />

        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎭 Genre :</Text>
        <TextInput style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} value={genre} onChangeText={setGenre} />

        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎬 Réalisateur :</Text>
        <TextInput style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} value={director} onChangeText={setDirector} />

        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎭 Acteurs principaux :</Text>
        <TextInput style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]} value={actors} onChangeText={setActors} />

        {/* Nouveau champ Synopsis modifiable */}
        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>📝 Synopsis :</Text>
        <TextInput
          style={[
            styles.input, 
            theme === 'dark' ? styles.darkInput : styles.lightInput,
            { height: 100, textAlignVertical: 'top' }
          ]}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Entrez le synopsis du film"
        />
        {/* 🎞️ Bande-annonce */}
        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>🎞️ Bande-annonce (YouTube) :</Text>
        <TextInput
          style={[styles.input, theme === 'dark' ? styles.darkInput : styles.lightInput]}
          value={trailerUrl}
          onChangeText={setTrailerUrl}
          placeholder="https://www.youtube.com/watch?v=..."
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Button title="🔍 Rechercher une bande-annonce (TMDb)" onPress={fetchTrailerUrl} />


        {/* ⭐ Note */}
        <Text style={[styles.label, theme === 'dark' ? styles.darkText : styles.lightText]}>⭐ Note :</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Text style={star <= rating ? styles.starSelected : styles.star}>★</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="✅ Mettre à jour" onPress={handleUpdateMovie} />
      </ScrollView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  lightContainer: { backgroundColor: "#fff" },
  darkContainer: { backgroundColor: "#121212" },
  label: { fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  lightText: { color: "#000" },
  darkText: { color: "#fff" },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 10,
  },
  lightInput: { backgroundColor: "#f9f9f9", borderColor: "#ccc", color: "#000" },
  darkInput: { backgroundColor: "#444", borderColor: "#888", color: "#fff" },

  movieImage: { width: 250, height: 350, resizeMode: 'cover', borderRadius: 10, marginHorizontal: 10 },
  imagePlaceholder: {
    width: "100%", height: 350, backgroundColor: "#ddd",
    justifyContent: "center", alignItems: "center", borderRadius: 10, marginBottom: 15
  },
  imagePlaceholderText: { fontSize: 16, color: "#777" },

  starsContainer: { flexDirection: "row", marginTop: 5, marginBottom: 15 },
  star: { fontSize: 30, color: "#ccc", marginHorizontal: 5 },
  starSelected: { fontSize: 30, color: "#FFD700", marginHorizontal: 5 },

  carouselContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  navButton: { justifyContent: 'center', alignItems: 'center', padding: 10 },
  navButtonText: { fontSize: 40, color: '#888' },
});
