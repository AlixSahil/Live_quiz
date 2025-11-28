import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Quiz, Question, Participant } from '../lib/supabase';
import { ArrowLeft, ChevronRight, Users, Trophy } from 'lucide-react';

type LeaderboardEntry = Participant & {
  rank: number;
};

export default function QuizMonitor() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [participants, setParticipants] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    loadQuizData();
    subscribeToUpdates();
  }, [quizId]);

  const loadQuizData = async () => {
    if (!quizId) return;

    try {
      const { data: quizData, error: quizError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;
      setQuiz(quizData);

      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData || []);

      await loadParticipants();
    } catch (err) {
      console.error('Error loading quiz data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadParticipants = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('total_score', { ascending: false });

    if (error) {
      console.error('Error loading participants:', error);
      return;
    }

    const ranked = (data || []).map((p, index) => ({
      ...p,
      rank: index + 1
    }));

    setParticipants(ranked);
  };

  const subscribeToUpdates = () => {
    if (!quizId) return;

    const channel = supabase
      .channel(`quiz-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
          filter: `quiz_id=eq.${quizId}`
        },
        () => {
          loadParticipants();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quizzes',
          filter: `id=eq.${quizId}`
        },
        (payload) => {
          setQuiz(payload.new as Quiz);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const nextQuestion = async () => {
    if (!quiz || !quizId) return;

    const nextIndex = quiz.current_question_index + 1;
    if (nextIndex >= questions.length) return;

    const { error } = await supabase
      .from('quizzes')
      .update({ current_question_index: nextIndex })
      .eq('id', quizId);

    if (error) console.error('Error advancing question:', error);
  };

  const endQuiz = async () => {
    if (!quizId) return;

    const { error } = await supabase
      .from('quizzes')
      .update({ ended: true })
      .eq('id', quizId);

    if (error) {
      console.error('Error ending quiz:', error);
    } else {
      navigate('/admin/dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Quiz not found</div>
      </div>
    );
  }

  const currentQuestion = questions[quiz.current_question_index];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.name}</h1>
              <p className="text-gray-600">
                Question {quiz.current_question_index + 1} of {questions.length}
              </p>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span className="font-semibold">{participants.length} participants</span>
            </div>
          </div>

          {currentQuestion && (
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Current Question:
              </h2>
              <p className="text-lg text-gray-700">{currentQuestion.question_text}</p>
            </div>
          )}

          <div className="flex gap-4">
            {quiz.current_question_index < questions.length - 1 ? (
              <button
                onClick={nextQuestion}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Next Question
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={endQuiz}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold"
              >
                End Quiz
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-2 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Live Leaderboard</h2>
          </div>

          {participants.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No participants yet</p>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold">{participant.rank}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{participant.name}</p>
                      <p className="text-sm text-gray-600">
                        {participant.department} • {participant.employee_code}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">{participant.total_score}</p>
                    <p className="text-sm text-gray-500">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
