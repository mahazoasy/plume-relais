import { useState, useEffect } from 'react';
import { storiesService } from '../services/supabase/stories';
import { Story } from '../types';

export const useStories = (filters?: { status?: string; visibility?: string }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStories();
  }, [filters]);

  const fetchStories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await storiesService.getStories(filters);
      setStories(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createStory = async (storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newStory = await storiesService.createStory(storyData);
      setStories(prev => [newStory, ...prev]);
      return newStory;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  const joinStory = async (storyId: string, userId: string) => {
    try {
      await storiesService.joinStory(storyId, userId);
      await fetchStories();
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { stories, isLoading, error, createStory, joinStory, refreshStories: fetchStories };
};