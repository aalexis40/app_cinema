import React, { useState, useEffect } from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
} from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './ThemeContext';
import MovieListScreen from './screens/MovieListScreen';
import MovieDetailsScreen from './screens/MovieDetailsScreen';
import AddMovieScreen from './screens/AddMovieScreen';
import SettingsScreen from './screens/SettingsScreen';
import EditMovieScreen from './screens/EditMovieScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import CategoryDetailsScreen from './screens/CategoryDetailsScreen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TouchableOpacity, useWindowDimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

// Navigators
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

// Types
type Movie = {
  id: string;
  title: string;
  year: number;
  director: string;
  genre: string;
  image?: string;
  actors?: string[];
};

type Category = {
  id: string;
  name: string;
  movieIds: string[];
};

// Custom Drawer
function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
    </DrawerContentScrollView>
  );
}

const SettingsStack = () => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#222' : '#fff',
        },
        headerTintColor: theme === 'dark' ? '#fff' : '#000',
        headerLeft: () =>
          navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
              <Icon name="arrow-left" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
              <Icon name="bars" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
      })}
    >
      <Stack.Screen
        name="SettingsScreen"
        component={SettingsScreen}
        options={{ title: '⚙️ Paramètres' }}
      />
    </Stack.Navigator>
  );
};

const CategoriesStack = ({
  categories,
  addCategory,
}: {
  categories: Category[];
  addCategory: (c: Category) => void;
}) => {
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: theme === 'dark' ? '#222' : '#fff',
        },
        headerTintColor: theme === 'dark' ? '#fff' : '#000',
        headerLeft: () =>
          navigation.canGoBack() ? (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
              <Icon name="arrow-left" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
              <Icon name="bars" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
            </TouchableOpacity>
          ),
      })}
    >
      <Stack.Screen
        name="CategoriesScreen"
        options={{ title: '📂 Mes Catégories' }}
      >
        {(props) => <CategoriesScreen {...props} categories={categories} addCategory={addCategory} />}
      </Stack.Screen>

      <Stack.Screen
        name="CategoryDetailsScreen"
        component={CategoryDetailsScreen}
        options={{ title: 'Détails de la Catégorie' }}
      />

      <Stack.Screen
        name="MovieDetails"
        component={MovieDetailsScreen}
        options={{ title: '📜 Détails du Film' }}
      />
    </Stack.Navigator>
  );
};

function AppNavigator() {
  const { theme } = useTheme();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const dimensions = useWindowDimensions();
  const isLandscape = dimensions.width > dimensions.height;

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const storedMovies = await AsyncStorage.getItem('movies');
        if (storedMovies) {
          const parsed = JSON.parse(storedMovies);
          if (Array.isArray(parsed)) {
            setMovies(parsed);
          } else {
            console.warn("Les données récupérées ne sont pas un tableau valide.");
          }
        }
      } catch (error) {
        console.error("Erreur de chargement des films :", error);
      }
    };

    const loadCategories = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem('categories');
        if (storedCategories) {
          const parsed = JSON.parse(storedCategories);
          setCategories(parsed);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error("Erreur de chargement des catégories :", error);
      }
    };

    loadMovies();
    loadCategories();
  }, []);

  const addMovie = async (movie: Movie) => {
    try {
      const storedMovies = await AsyncStorage.getItem('movies');
      const moviesList: Movie[] = storedMovies ? JSON.parse(storedMovies) : [];
      const newMovies = [...moviesList, movie];
      await AsyncStorage.setItem('movies', JSON.stringify(newMovies));
      setMovies(newMovies);
    } catch (error) {
      console.error("Erreur de sauvegarde :", error);
    }
  };

  const addCategory = async (category: Category) => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      const categoriesList: Category[] = storedCategories ? JSON.parse(storedCategories) : [];
      const newCategories = [...categoriesList, category];
      await AsyncStorage.setItem('categories', JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error("Erreur de sauvegarde des catégories :", error);
    }
  };

  return (
    <NavigationContainer theme={theme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: theme === 'dark' ? '#222' : '#fff',
            width: isLandscape ? '50%' : '75%',
          },
          drawerType: 'front', // toujours front => empêche l'ouverture auto
          overlayColor: isLandscape ? 'transparent' : 'rgba(0,0,0,0.5)',
        }}
      >
        <Drawer.Screen name="MoviesStack" options={{ title: '🎥 Mes Films' }}>
          {() => (
            <Stack.Navigator
              screenOptions={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                  backgroundColor: theme === 'dark' ? '#222' : '#fff',
                },
                headerTintColor: theme === 'dark' ? '#fff' : '#000',
                headerLeft: () =>
                  navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                      <Icon name="arrow-left" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
                      <Icon name="bars" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  ),
              })}
            >
              <Stack.Screen
                name="MovieList"
                options={{ title: '🎥 Mes Films' }}
              >
                {(props) => <MovieListScreen {...props} movies={movies} />}
              </Stack.Screen>

              <Stack.Screen
                name="MovieDetails"
                component={MovieDetailsScreen}
                options={{ title: '📜 Détails du Film' }}
              />

              <Stack.Screen
                name="AddMovie"
                options={{ title: '➕ Ajouter un Film' }}
              >
                {(props) => <AddMovieScreen {...props} addMovie={addMovie} />}
              </Stack.Screen>

              <Stack.Screen
                name="EditMovie"
                component={EditMovieScreen}
                options={{ title: '✏️ Modifier le Film' }}
              />
            </Stack.Navigator>
          )}
        </Drawer.Screen>

        <Drawer.Screen name="AddMovieDrawer" options={{ title: '➕ Ajouter un Film' }}>
          {() => (
            <Stack.Navigator
              screenOptions={({ navigation }) => ({
                headerShown: true,
                headerStyle: {
                  backgroundColor: theme === 'dark' ? '#222' : '#fff',
                },
                headerTintColor: theme === 'dark' ? '#fff' : '#000',
                headerLeft: () =>
                  navigation.canGoBack() ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 15 }}>
                      <Icon name="arrow-left" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={{ marginLeft: 15 }}>
                      <Icon name="bars" size={24} color={theme === 'dark' ? '#fff' : '#000'} />
                    </TouchableOpacity>
                  ),
              })}
            >
              <Stack.Screen name="AddMovieScreen" options={{ title: '➕ Ajouter un Film' }}>
                {(props) => <AddMovieScreen {...props} addMovie={addMovie} />}
              </Stack.Screen>
            </Stack.Navigator>
          )}
        </Drawer.Screen>

        <Drawer.Screen name="Categories" options={{ title: '📂 Mes Catégories' }}>
          {(props) => <CategoriesStack {...props} categories={categories} addCategory={addCategory} />}
        </Drawer.Screen>

        <Drawer.Screen
          name="Settings"
          options={{ title: '⚙️ Paramètres' }}
        >
          {() => <SettingsStack />}
        </Drawer.Screen>
      </Drawer.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AppNavigator />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
