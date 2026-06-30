import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useStories } from '../../src/hooks/useStories';
import { useAuth } from '../../src/contexts/AuthContext';
import { StoryCard } from '../../src/components/stories/StoryCard';
import { LoadingSpinner } from '../../src/components/common/LoadingSpinner';
import { Button } from '../../src/components/common/Button';
import { router } from 'expo-router';
import { supabase } from '../../src/config/supabase';

export default function HomeScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'participating' | 'open' | 'completed'>('participating');
  const { stories, isLoading, error, refreshStories } = useStories();

  const filteredStories = stories.filter(story => {
    if (activeTab === 'participating') {
      return story.participants?.some(p => p.user_id === user?.id) && story.status !== 'completed';
    }
    if (activeTab === 'open') {
      return story.status === 'open' && story.visibility === 'public';
    }
    return story.status === 'completed';
  });

  const handleCreateStory = () => {
    router.push('/create');
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Plume Relais</Text>
        <Button
          title="Nouvelle histoire"
          onPress={handleCreateStory}
          size="small"
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'participating' && styles.activeTab]}
          onPress={() => setActiveTab('participating')}
        >
          <Text style={[styles.tabText, activeTab === 'participating' && styles.activeTabText]}>
            Mes histoires
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && styles.activeTab]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, activeTab === 'open' && styles.activeTabText]}>
            À rejoindre
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.activeTab]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.activeTabText]}>
            Terminées
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredStories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <StoryCard story={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refreshStories} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {activeTab === 'participating'
                ? "Vous ne participez à aucune histoire pour le moment"
                : activeTab === 'open'
                ? "Aucune histoire ouverte à rejoindre"
                : "Aucune histoire terminée"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6C63FF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#6C63FF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});