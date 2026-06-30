import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Story {
  id: string;
  title: string;
  description: string;
  status: string;
  current_turn: number;
}

export default function Explore() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stories')
        .select('*')
        .eq('visibility', 'public')
        .in('status', ['open', 'in_progress']);

      if (search) {
        query = query.ilike('title', `%${search}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStory = ({ item }: { item: Story }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => router.push(`/story/${item.id}`)}
    >
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description || 'Aucune description'}
      </Text>
      <View style={styles.cardFooter}>
        <Text style={styles.cardStatus}>
          {item.status === 'open' ? '🔓 Ouverte' : '🔄 En cours'}
        </Text>
        <Text style={styles.cardTurn}>Tour {item.current_turn}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Explorer</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher..."
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={fetchStories}
        />
      </View>

      <FlatList
        data={stories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Aucune histoire trouvée
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#6C63FF' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    margin: 16,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 16 },
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  cardDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cardStatus: { fontSize: 12, color: '#6C63FF' },
  cardTurn: { fontSize: 12, color: '#999' },
  empty: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#999' },
});