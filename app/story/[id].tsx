import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/config/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Contribution {
  id: string;
  content: string;
  author_id: string;
  turn_number: number;
  is_canon: boolean;
  author?: { username: string };
}

interface Story {
  id: string;
  title: string;
  description: string;
  status: string;
  current_turn: number;
  blind_mode: boolean;
  created_by: string;
}

export default function StoryDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    fetchStory();
    fetchContributions();
    checkParticipation();
  }, [id]);

  const fetchStory = async () => {
    const { data, error } = await supabase
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();
    if (!error) setStory(data);
  };

  const fetchContributions = async () => {
    const { data, error } = await supabase
      .from('contributions')
      .select('*, author:users(username)')
      .eq('story_id', id)
      .order('created_at', { ascending: true });
    if (!error) setContributions(data || []);
    setLoading(false);
  };

  const checkParticipation = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('story_participations')
      .select('*')
      .eq('story_id', id)
      .eq('user_id', user.id)
      .single();
    setIsParticipant(!!data);
  };

  const joinStory = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Connectez-vous d\'abord');
      return;
    }
    const { error } = await supabase
      .from('story_participations')
      .insert({ story_id: id, user_id: user.id });
    if (error) {
      Alert.alert('Erreur', error.message);
    } else {
      setIsParticipant(true);
      Alert.alert('Succès', 'Vous avez rejoint l\'histoire !');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={styles.centered}>
        <Text>Histoire non trouvée</Text>
      </View>
    );
  }

  const canonContributions = contributions.filter(c => c.is_canon);
  const pendingContributions = contributions.filter(c => !c.is_canon && c.turn_number === story.current_turn);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{story.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>{story.description}</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoText}>Tour {story.current_turn}</Text>
          <Text style={styles.infoText}>
            {story.status === 'open' ? '🔓 Ouverte' :
             story.status === 'in_progress' ? '🔄 En cours' : '✅ Terminée'}
          </Text>
        </View>

        {!isParticipant && story.status !== 'completed' && (
          <TouchableOpacity style={styles.joinButton} onPress={joinStory}>
            <Text style={styles.joinButtonText}>Rejoindre l'histoire</Text>
          </TouchableOpacity>
        )}

        {isParticipant && story.status !== 'completed' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push(`/story/contribute?id=${id}`)}
            >
              <Ionicons name="create-outline" size={20} color="#6C63FF" />
              <Text style={styles.actionButtonText}>Contribuer</Text>
            </TouchableOpacity>
            {pendingContributions.length > 0 && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/story/vote?id=${id}`)}
              >
                <Ionicons name="thumbs-up-outline" size={20} color="#6C63FF" />
                <Text style={styles.actionButtonText}>Voter</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>📖 Récit</Text>
        {canonContributions.map((c, index) => (
          <View key={c.id} style={styles.contribution}>
            <View style={styles.contributionHeader}>
              <Text style={styles.contributionAuthor}>
                {c.author?.username || 'Anonyme'}
              </Text>
              <Text style={styles.contributionTurn}>Tour {c.turn_number}</Text>
            </View>
            <Text style={styles.contributionText}>{c.content}</Text>
          </View>
        ))}

        {pendingContributions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📝 Propositions en attente</Text>
            {pendingContributions.map((c) => (
              <View key={c.id} style={[styles.contribution, styles.pending]}>
                <Text style={styles.contributionText}>{c.content}</Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginLeft: 12 },
  content: { padding: 16 },
  description: { fontSize: 14, color: '#666' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 8,
  },
  infoText: { fontSize: 14, color: '#6C63FF' },
  joinButton: {
    backgroundColor: '#6C63FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  joinButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#6C63FF',
    gap: 8,
  },
  actionButtonText: { color: '#6C63FF', fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12 },
  contribution: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
  },
  pending: {
    borderLeftColor: '#FFB800',
  },
  contributionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionAuthor: { fontSize: 12, color: '#6C63FF', fontWeight: '600' },
  contributionTurn: { fontSize: 12, color: '#999' },
  contributionText: { fontSize: 14, color: '#333' },
});