import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function Contribute() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Erreur', 'Veuillez écrire votre contribution');
      return;
    }

    setLoading(true);
    try {
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .select('current_turn')
        .eq('id', id)
        .single();

      if (storyError) throw storyError;

      const { error } = await supabase
        .from('contributions')
        .insert({
          story_id: id,
          author_id: user?.id,
          content: content.trim(),
          turn_number: story.current_turn,
          is_canon: false,
        });

      if (error) throw error;

      Alert.alert('Succès', 'Votre contribution a été soumise !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contribuer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>Écrivez votre suite</Text>
        <Text style={styles.hint}>Continuez l'histoire avec votre style</Text>

        <TextInput
          style={styles.textArea}
          placeholder="Écrivez ici..."
          value={content}
          onChangeText={setContent}
          multiline
          numberOfLines={10}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitButtonText}>Soumettre</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  content: { padding: 16, flex: 1 },
  label: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  hint: { fontSize: 14, color: '#666', marginTop: 4, marginBottom: 16 },
  textArea: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    fontSize: 16,
    minHeight: 200,
  },
  submitButton: {
    backgroundColor: '#6C63FF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});