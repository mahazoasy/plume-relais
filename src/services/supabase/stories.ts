import { supabase } from '../../config/supabase';
import { Story, StoryParticipation } from '../../types';

export const storiesService = {
  async createStory(storyData: Omit<Story, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('stories')
      .insert([storyData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getStories(filters?: { status?: string; visibility?: string }) {
    let query = supabase
      .from('stories')
      .select(`
        *,
        created_by_user:users!created_by(username, avatar_url),
        participants:story_participations(count)
      `);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.visibility) {
      query = query.eq('visibility', filters.visibility);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async getStoryById(id: string) {
    const { data, error } = await supabase
      .from('stories')
      .select(`
        *,
        created_by_user:users!created_by(username, avatar_url),
        contributions(
          *,
          author:users(username, avatar_url),
          votes(count)
        ),
        participants:story_participations(
          user_id,
          users(username, avatar_url)
        )
      `)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async joinStory(storyId: string, userId: string) {
    const { data, error } = await supabase
      .from('story_participations')
      .insert([{ story_id: storyId, user_id: userId }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStoryStatus(storyId: string, status: Story['status']) {
    const { data, error } = await supabase
      .from('stories')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', storyId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  subscribeToStory(storyId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`story:${storyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `id=eq.${storyId}`,
        },
        callback
      )
      .subscribe();
  },
};