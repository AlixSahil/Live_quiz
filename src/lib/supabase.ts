import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Quiz = {
  id: string;
  name: string;
  start_time: string;
  started: boolean;
  ended: boolean;
  current_question_index: number;
  created_by: string;
  created_at: string;
};

export type Question = {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_option: number;
  order_index: number;
  created_at: string;
};

export type Participant = {
  id: string;
  quiz_id: string;
  name: string;
  department: string;
  employee_code: string;
  total_score: number;
  joined_at: string;
};

export type Answer = {
  id: string;
  quiz_id: string;
  participant_id: string;
  question_id: string;
  selected_option: number;
  is_correct: boolean;
  answer_rank: number | null;
  points_earned: number;
  answered_at: string;
};
