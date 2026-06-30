import { supabase } from '../../config/supabase';

export const supabaseClient = supabase;

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return {
    error: error.message || 'Une erreur est survenue',
  };
};