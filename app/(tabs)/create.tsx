import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Create() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [opening, setOpening] = useState('');
  const [maxContrib, setMaxContrib] = useState('10');
  const [duration, setDuration] = useState('5');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [blindMode, setBlindMode] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !opening.trim()) {
      Alert.alert('Erreur', 'Le titre et le paragraphe d\'ouverture sont requis');
      return;
    }

    setLoading(true);
    try {
      // Créer l'histoire
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: title.trim(),
          description: description.trim(),
          created_by: user?.id,
          status: 'open',
          max_contributions: parseInt(maxContrib),
          current_turn: 1,
          visibility,
          turn_duration: parseInt(duration),
          blind_mode: blindMode,
        })
        .select()
        .single();

      if (storyError) throw storyError;

      // Ajouter le paragraphe d'ouverture
      await supabase.from('contributions').insert({
        story_id: story.id,
        author_id: user?.id,
        content: opening.trim(),
        turn_number: 1,
        is_canon: true,
      });

      // Ajouter le créateur comme participant
      await supabase.from('story_participations').insert({
        story_id: story.id,
        user_id: user?.id,
        has_written_current_turn: true,
      });

      Alert.alert('Succès', 'Histoire créée !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Créer une histoire</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Titre *</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Paragraphe d'ouverture *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={opening}
          onChangeText={setOpening}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Nombre max de contributions</Text>
        <TextInput
          style={styles.input}
          value={maxContrib}
          onChangeText={setMaxContrib}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Durée d'un tour (minutes)</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          keyboardType="numeric"
        />

        <Text style={styles.label}>Visibilité</Text>
        <View style={styles.visibilityContainer}>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'public' && styles.visibilityActive]}
            onPress={() => setVisibility('public')}
          >
            <Text style={[styles.visibilityText, visibility === 'public' && styles.visibilityTextActive]}>
              🌍 Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.visibilityOption, visibility === 'private' && styles.visibilityActive]}
            onPress={() => setVisibility('private')}
          >
            <Text style={[styles.visibilityText, visibility === 'private' && styles.visibilityTextActive]}>
              🔒 Privé
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Mode à l'aveugle</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>
              {blindMode ? 'Activé' : 'Désactivé'}
            </Text>
            <Switch
              value={blindMode}
              onValueChange={setBlindMode}
              trackColor={{ false: '#E0E0E0', true: '#6C63FF' }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.createButtonText}>Créer l'histoire</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  form: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  visibilityContainer: { flexDirection: 'row', gap: 12 },
  visibilityOption: {
    flex: 1,
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  visibilityActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  visibilityText: { color: '#666' },
  visibilityTextActive: { color: '#FFF' },
  switchContainer: { marginTop: 16 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  switchLabel: { color: '#666' },
  createButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 40,
  },
  createButtonDisabled: { opacity: 0.7 },
  createButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});