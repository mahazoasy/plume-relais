import { supabase } from '../../config/supabase';
import { Vote } from '../../types';

export const votesService = {
  async castVote(voteData: Omit<Vote, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('votes')
      .insert([voteData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getUserVoteForTurn(storyId: string, userId: string, turnNumber: number) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('story_id', storyId)
      .eq('user_id', userId)
      .eq('turn_number', turnNumber)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getVotesForContribution(contributionId: string) {
    const { data, error } = await supabase
      .from('votes')
      .select('*')
      .eq('contribution_id', contributionId);
    if (error) throw error;
    return data;
  },

  subscribeToVotes(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`votes:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `story_id=eq.${storyId}`,
        },
        callback
      )
      .subscribe();
  },
};