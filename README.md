# app_muscu

**app_muscu** est une application mobile développée avec **React Native** qui permet de gérer votre collection de films. Vous pouvez ajouter, modifier, supprimer des films, rechercher des informations et affiches via **OMDb** et **TMDb**, consulter les bandes-annonces et exporter/importer vos données.  

---

## Fonctionnalités principales

- Ajouter, modifier et supprimer des films dans votre collection.  
- Recherche de films via OMDb et TMDb avec pagination et fusion des résultats.  
- Affichage des informations détaillées : titre, année, réalisateur, genre, acteurs, synopsis, image et bande-annonce YouTube.  
- Notation des films avec système d’étoiles.  
- Gestion multilingue des images via TMDb (français / anglais).  
- Import/export des films et catégories en JSON.  
- Mode sombre et clair.  
- Adaptation à l’orientation portrait/paysage.  

---

## Technologies utilisées

- [React Native](https://reactnative.dev/)  
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/) pour la persistance locale  
- [OMDb API](http://www.omdbapi.com/) pour la recherche de films  
- [TMDb API](https://www.themoviedb.org/) pour les affiches et bandes-annonces  
- [Expo](https://expo.dev/) pour simplifier le développement mobile  
- [react-native-webview](https://github.com/react-native-webview/react-native-webview) pour afficher les trailers  
- [Moti](https://moti.fyi/) pour les animations  
- [react-native-gesture-handler](https://docs.swmansion.com/react-native-gesture-handler/docs/) pour le swipe-to-delete  
- [react-native-text-ticker](https://github.com/JanGorman/react-native-text-ticker) pour les titres défilants  

---

## Installation

1. Cloner le repository  

```bash
git clone https://github.com/votre-utilisateur/movie-manager-app.git
cd movie-manager-app
```
2. Installer les dépendances
```bash
npm install
# ou
yarn install
```

3. Lancer l’application avec Expo
```bash
npx expo start
```
