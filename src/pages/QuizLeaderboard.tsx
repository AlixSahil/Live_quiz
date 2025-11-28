import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Quiz, Participant } from '../lib/supabase';
import { Trophy, Medal, Award, ArrowLeft } from 'lucide-react';

type LeaderboardEntry = Participant & {
  rank: number;
};

export default function QuizLeaderboard() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentParticipantId, setCurrentParticipantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!quizId) return;

    const participantId = localStorage.getItem(`participant-${quizId}`);
    setCurrentParticipantId(participantId);

    loadQuiz();
    loadLeaderboard();
    subscribeToUpdates();
  }, [quizId]);

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
  };

  const loadLeaderboard = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('total_score', { ascending: false });

    if (error) {
      console.error('Error loading leaderboard:', error);
      setLoading(false);
      return;
    }

    const ranked = (data || []).map((p, index) => ({
      ...p,
      rank: index + 1
    }));

    setLeaderboard(ranked);
    setLoading(false);
  };

  const subscribeToUpdates = () => {
    if (!quizId) return;

    const channel = supabase
      .channel(`leaderboard-${quizId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'participants',
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

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-600" />;
      default:
        return null;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500';
      case 2:
        return 'bg-gray-400';
      case 3:
        return 'bg-orange-600';
      default:
        return 'bg-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {currentParticipantId && (
          <button
            onClick={() => navigate(`/quiz/${quizId}/play`)}
            className="flex items-center gap-2 text-white hover:text-blue-200 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quiz
          </button>
        )}

        <div className="bg-white rounded-lg shadow-2xl p-8 mb-6">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-yellow-100 rounded-full mb-4">
              <Trophy className="w-16 h-16 text-yellow-500" />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {quiz?.name}
            </h1>
            <p className="text-xl text-gray-600">
              {quiz?.ended ? 'Final Results' : 'Live Leaderboard'}
            </p>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No participants yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboard.map((entry) => {
                const isCurrentUser = entry.id === currentParticipantId;
                const icon = getRankIcon(entry.rank);

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-6 rounded-lg transition transform ${
                      isCurrentUser
                        ? 'bg-blue-50 border-2 border-blue-500 scale-105'
                        : entry.rank <= 3
                        ? 'bg-gradient-to-r from-yellow-50 to-orange-50'
                        : 'bg-gray-50'
                    } hover:shadow-md`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-16">
                        {icon || (
                          <div
                            className={`w-12 h-12 rounded-full ${getRankBadgeColor(
                              entry.rank
                            )} flex items-center justify-center`}
                          >
                            <span className="text-white font-bold text-xl">
                              {entry.rank}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="font-bold text-lg text-gray-800">
                          {entry.name}
                          {isCurrentUser && (
                            <span className="ml-2 text-sm text-blue-600 font-normal">
                              (You)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">
                          {entry.department} • {entry.employee_code}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">
                          {entry.total_score}
                        </p>
                        <p className="text-sm text-gray-500">points</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {quiz?.ended && (
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Quiz Completed!
            </h2>
            <p className="text-gray-600">
              Thank you for participating. Check your ranking above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
