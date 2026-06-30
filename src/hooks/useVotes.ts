import { useState, useEffect } from 'react';
import { votesService } from '../services/supabase/votes';
import { Vote } from '../types';

export const useVotes = (storyId: string, turnNumber: number) => {
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (storyId && turnNumber) {
      fetchUserVote();
    }
  }, [storyId, turnNumber]);

  const fetchUserVote = async () => {
    // This needs userId from context
    // Implementation would use auth context
  };

  const castVote = async (contributionId: string, userId: string) => {
    try {
      const vote = await votesService.castVote({
        contribution_id: contributionId,
        user_id: userId,
        story_id: storyId,
        turn_number: turnNumber,
      });
      setUserVote(vote);
      return vote;
    } catch (err: any) {
      throw new Error(err.message);
    }
  };

  return { userVote, isLoading, error, castVote };
};