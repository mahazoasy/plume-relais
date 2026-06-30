import { useState, useEffect } from 'react';
import { contributionsService } from '../services/supabase/contributions';
import { Contribution } from '../types';

export const useContributions = (storyId: string, turnNumber?: number) => {
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId) {
      fetchContributions();
    }
  }, [storyId, turnNumber]);

  const fetchContributions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contributionsService.getStoryContributions(storyId, turnNumber);
      setContributions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addContribution = async (contributionData: Omit<Contribution, 'id' | 'created_at' | 'votes_count'>) => {
    try {
      const newContribution = await contributionsService.addContribution(contributionData);
      setContributions(prev => [...prev, newContribution]);
      return newContribution;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { contributions, isLoading, error, addContribution, refreshContributions: fetchContributions };
};