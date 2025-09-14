import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../ThemeContext';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleError = (title: string, error: any) => {
    console.error(`❌ ${title} :`, error);
    Alert.alert("Erreur", `Une erreur est survenue : ${title}`);
  };

  const themedStyles = getThemedStyles(isDark);

  const exportData = async (key: string, filename: string) => {
    try {
      const storedData = await AsyncStorage.getItem(key);
      if (!storedData) return Alert.alert("Aucune donnée", `Aucune donnée ${key} à exporter.`);
      const jsonData = JSON.stringify(JSON.parse(storedData), null, 2);
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.writeAsStringAsync(fileUri, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri);
      Alert.alert("✅ Export réussi", `${filename} prêt à être partagé.`);
    } catch (error) {
      handleError(`exportation de ${key}`, error);
    }
  };

  const importData = async (key: string, name: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
      if (result.canceled || !result.assets?.length) return;

      const fileUri = result.assets[0].uri;
      const content = await FileSystem.readAsStringAsync(fileUri);
      const imported = JSON.parse(content);

      if (!Array.isArray(imported)) return Alert.alert("Format invalide", "Le fichier n'est pas un tableau JSON.");

      const current = await AsyncStorage.getItem(key);
      const currentParsed = current ? JSON.parse(current) : [];

      Alert.alert(
        `Importer ${name}`,
        `Voulez-vous remplacer ou fusionner les ${name.toLowerCase()} ?`,
        [
          {
            text: "🗑️ Remplacer",
            onPress: async () => {
              await AsyncStorage.setItem(key, JSON.stringify(imported));
              Alert.alert("Importation terminée", `${name} remplacés avec succès.`);
            },
          },
          {
            text: "➕ Fusionner",
            onPress: async () => {
              const merged = [...currentParsed];
              imported.forEach((item: any) => {
                if (!merged.some((existing: any) => existing.id === item.id)) {
                  merged.push(item);
                }
              });
              await AsyncStorage.setItem(key, JSON.stringify(merged));
              Alert.alert("Importation terminée", `Fusion des ${name.toLowerCase()} réussie.`);
            },
          },
          { text: "Annuler", style: 'cancel' }
        ]
      );
    } catch (error) {
      handleError(`importation de ${name}`, error);
    }
  };

  return (
    <ScrollView contentContainerStyle={[themedStyles.container]}>
      <Text style={themedStyles.title}>⚙️ Paramètres</Text>

      <TouchableOpacity style={themedStyles.themeToggle} onPress={toggleTheme}>
        <Text style={themedStyles.buttonText}>
          {isDark ? "☀️ Basculer en mode clair" : "🌙 Basculer en mode sombre"}
        </Text>
      </TouchableOpacity>

      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>🎬 Films</Text>
        <View style={themedStyles.row}>
          <TouchableOpacity style={themedStyles.button} onPress={() => exportData('movies', 'movies.json')}>
            <Text style={themedStyles.buttonText}>📤 Exporter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={themedStyles.button} onPress={() => importData('movies', 'Films')}>
            <Text style={themedStyles.buttonText}>📥 Importer</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={themedStyles.section}>
        <Text style={themedStyles.sectionTitle}>📁 Catégories</Text>
        <View style={themedStyles.row}>
          <TouchableOpacity style={themedStyles.button} onPress={() => exportData('categories', 'categories.json')}>
            <Text style={themedStyles.buttonText}>📤 Exporter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={themedStyles.button} onPress={() => importData('categories', 'Catégories')}>
            <Text style={themedStyles.buttonText}>📥 Importer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const getThemedStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: isDark ? '#121212' : '#f5f5f5',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    color: isDark ? '#fff' : '#222',
  },
  themeToggle: {
    backgroundColor: isDark ? '#444' : '#e0e0e0',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
  },
  section: {
    width: '100%',
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: isDark ? '#f0f0f0' : '#333',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  button: {
    flex: 1,
    backgroundColor: isDark ? '#1e88e5' : '#1976d2',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
