import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Quiz, Question, Participant } from '../lib/supabase';
import { Clock, Trophy } from 'lucide-react';

type LeaderboardEntry = Participant & {
  rank: number;
};

export default function QuizPlay() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);

  useEffect(() => {
    if (!quizId) return;

    const participantId = localStorage.getItem(`participant-${quizId}`);
    if (!participantId) {
      navigate(`/quiz/${quizId}/join`);
      return;
    }

    loadParticipant(participantId);
    loadQuiz();
    loadLeaderboard();
    subscribeToUpdates();
  }, [quizId, navigate]);

  const loadLeaderboard = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('total_score', { ascending: false });

    if (error) {
      console.error('Error loading leaderboard:', error);
      return;
    }

    const ranked = (data || []).map((p, index) => ({
      ...p,
      rank: index + 1
    }));

    setLeaderboard(ranked);
  };

  const loadParticipant = async (participantId: string) => {
    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('id', participantId)
      .single();

    if (error) {
      console.error('Error loading participant:', error);
      navigate(`/quiz/${quizId}/join`);
      return;
    }

    setParticipant(data);
  };

  const loadQuiz = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single();

    if (error) {
      console.error('Error loading quiz:', error);
      return;
    }

    setQuiz(data);

    if (!data.started) {
      navigate(`/quiz/${quizId}/wait`);
      return;
    }

    if (data.ended) {
      navigate(`/quiz/${quizId}/leaderboard`);
      return;
    }

    await loadCurrentQuestion(data.current_question_index);
  };

  const loadCurrentQuestion = async (questionIndex: number) => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('order_index', questionIndex)
      .single();

    if (error) {
      console.error('Error loading question:', error);
      return;
    }

    setCurrentQuestion(data);
    setSelectedOption(null);
    setHasAnswered(false);

    if (participant) {
      await checkIfAnswered(data.id, participant.id);
    }
  };

  const checkIfAnswered = async (questionId: string, participantId: string) => {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('question_id', questionId)
      .eq('participant_id', participantId)
      .maybeSingle();

    if (!error && data) {
      setHasAnswered(true);
      setSelectedOption(data.selected_option);
    }
  };

  const subscribeToUpdates = () => {
    if (!quizId) return;

    const channel = supabase
      .channel(`quiz-play-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quizzes',
          filter: `id=eq.${quizId}`
        },
        (payload) => {
          const updated = payload.new as Quiz;
          setQuiz(updated);

          if (updated.ended) {
            navigate(`/quiz/${quizId}/leaderboard`);
          } else if (updated.current_question_index !== quiz?.current_question_index) {
            loadCurrentQuestion(updated.current_question_index);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'participants',
          filter: `quiz_id=eq.${quizId}`
        },
        () => {
          loadLeaderboard();
          loadParticipant(participant?.id || '');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `quiz_id=eq.${quizId}`
        },
        () => {
          loadLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmitAnswer = async () => {
    if (!quizId || !currentQuestion || !participant || selectedOption === null || hasAnswered) {
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-answer`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            quiz_id: quizId,
            participant_id: participant.id,
            question_id: currentQuestion.id,
            selected_option: selectedOption
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }

      setHasAnswered(true);

      if (participant) {
        loadParticipant(participant.id);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      alert('Failed to submit answer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz || !currentQuestion || !participant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  const currentUserRank = leaderboard.find(l => l.id === participant.id)?.rank;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 p-4">
      <div className="max-w-7xl mx-auto pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">{participant.name}</h2>
                  <p className="text-sm text-gray-600">{participant.department}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">{participant.total_score}</p>
                  <p className="text-sm text-gray-600">points</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <Clock className="w-5 h-5" />
                <span>Question {quiz.current_question_index + 1}</span>
              </div>

              <div className="bg-blue-50 rounded-lg p-6 mb-8">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                  {currentQuestion.question_text}
                </h1>

                <div className="space-y-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => !hasAnswered && setSelectedOption(index)}
                      disabled={hasAnswered}
                      className={`w-full text-left p-4 rounded-lg border-2 transition ${
                        selectedOption === index
                          ? 'border-blue-600 bg-blue-100'
                          : 'border-gray-300 bg-white hover:border-blue-400'
                      } ${hasAnswered ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            selectedOption === index
                              ? 'border-blue-600 bg-blue-600'
                              : 'border-gray-300'
                          }`}
                        >
                          {selectedOption === index && (
                            <div className="w-3 h-3 rounded-full bg-white"></div>
                          )}
                        </div>
                        <span className="text-lg">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {hasAnswered ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-center">
                  Answer submitted! Waiting for next question...
                </div>
              ) : (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={selectedOption === null || submitting}
                  className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Answer'}
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-2xl p-6 sticky top-8">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h3 className="text-xl font-bold text-gray-800">Live Leaderboard</h3>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 text-sm">No participants yet</p>
                ) : (
                  leaderboard.map((entry) => (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-lg transition ${
                        entry.id === participant.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{entry.rank}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 text-sm truncate">
                            {entry.name}
                          </p>
                          <p className="text-xs text-gray-600 truncate">
                            {entry.department}
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-blue-600">{entry.total_score}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {currentUserRank && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">Your Rank</p>
                  <p className="text-2xl font-bold text-blue-600">#{currentUserRank}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
