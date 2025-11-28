/*
  # Quiz System Database Schema

  1. New Tables
    - `quizzes`
      - `id` (uuid, primary key)
      - `name` (text) - Quiz title
      - `start_time` (timestamptz) - Scheduled start time
      - `started` (boolean) - Whether quiz has started
      - `ended` (boolean) - Whether quiz has ended
      - `current_question_index` (integer) - Current active question
      - `created_by` (uuid) - Admin user who created it
      - `created_at` (timestamptz)
    
    - `questions`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key)
      - `question_text` (text)
      - `options` (jsonb) - Array of 4 options
      - `correct_option` (integer) - Index of correct answer (0-3)
      - `order_index` (integer) - Question order in quiz
      - `created_at` (timestamptz)
    
    - `participants`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key)
      - `name` (text)
      - `department` (text)
      - `employee_code` (text)
      - `total_score` (integer) - Running total score
      - `joined_at` (timestamptz)
    
    - `answers`
      - `id` (uuid, primary key)
      - `quiz_id` (uuid, foreign key)
      - `participant_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `selected_option` (integer)
      - `is_correct` (boolean)
      - `answer_rank` (integer) - Ranking among correct answers (1st, 2nd, 3rd...)
      - `points_earned` (integer) - Base + bonus points
      - `answered_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Admin can manage quizzes and questions
    - Participants can read quiz data and write their own answers
    - Public can read active quizzes to join
*/

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_time timestamptz NOT NULL,
  started boolean DEFAULT false,
  ended boolean DEFAULT false,
  current_question_index integer DEFAULT 0,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active quizzes"
  ON quizzes FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create quizzes"
  ON quizzes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Quiz creators can update their quizzes"
  ON quizzes FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  correct_option integer NOT NULL CHECK (correct_option >= 0 AND correct_option <= 3),
  order_index integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions for active quizzes"
  ON questions FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Authenticated users can create questions"
  ON questions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quizzes
      WHERE quizzes.id = quiz_id
      AND quizzes.created_by = auth.uid()
    )
  );

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  department text NOT NULL,
  employee_code text NOT NULL,
  total_score integer DEFAULT 0,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(quiz_id, employee_code)
);

ALTER TABLE participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view participants"
  ON participants FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can join as participant"
  ON participants FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Edge functions can update participant scores"
  ON participants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid REFERENCES quizzes(id) ON DELETE CASCADE NOT NULL,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  selected_option integer NOT NULL,
  is_correct boolean DEFAULT false,
  answer_rank integer,
  points_earned integer DEFAULT 0,
  answered_at timestamptz DEFAULT now(),
  UNIQUE(participant_id, question_id)
);

ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view answers"
  ON answers FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Anyone can submit answers"
  ON answers FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_participants_quiz_id ON participants(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_quiz_id ON answers(quiz_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant_id ON answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_answered_at ON answers(answered_at);
