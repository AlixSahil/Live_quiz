import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Quiz } from '../lib/supabase';
import { Plus, LogOut, Play, StopCircle, Users, Trophy } from 'lucide-react';

export default function AdminDashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/admin/login');
      return;
    }

    loadQuizzes();
  }, [user, navigate]);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('created_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (err) {
      console.error('Error loading quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const startQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ started: true })
        .eq('id', quizId);

      if (error) throw error;
      navigate(`/admin/quiz/${quizId}/monitor`);
    } catch (err) {
      console.error('Error starting quiz:', err);
    }
  };

  const endQuiz = async (quizId: string) => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ ended: true })
        .eq('id', quizId);

      if (error) throw error;
      loadQuizzes();
    } catch (err) {
      console.error('Error ending quiz:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Your Quizzes</h2>
          <button
            onClick={() => navigate('/admin/create-quiz')}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Quiz
          </button>
        </div>

        {quizzes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No quizzes yet</h3>
            <p className="text-gray-500 mb-6">Create your first quiz to get started</p>
            <button
              onClick={() => navigate('/admin/create-quiz')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              <Plus className="w-5 h-5" />
              Create Quiz
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{quiz.name}</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Start: {new Date(quiz.start_time).toLocaleString()}
                </p>

                <div className="flex items-center gap-2 mb-4">
                  {quiz.ended ? (
                    <span className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
                      Ended
                    </span>
                  ) : quiz.started ? (
                    <span className="px-3 py-1 bg-green-200 text-green-700 rounded-full text-sm font-medium">
                      Live
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-700 rounded-full text-sm font-medium">
                      Scheduled
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!quiz.started && !quiz.ended && (
                    <button
                      onClick={() => startQuiz(quiz.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <Play className="w-4 h-4" />
                      Start
                    </button>
                  )}
                  {quiz.started && !quiz.ended && (
                    <>
                      <button
                        onClick={() => navigate(`/admin/quiz/${quiz.id}/monitor`)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Users className="w-4 h-4" />
                        Monitor
                      </button>
                      <button
                        onClick={() => endQuiz(quiz.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <StopCircle className="w-4 h-4" />
                        End
                      </button>
                    </>
                  )}
                  {quiz.ended && (
                    <button
                      onClick={() => navigate(`/quiz/${quiz.id}/leaderboard`)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                      <Trophy className="w-4 h-4" />
                      Results
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    const url = `${window.location.origin}/quiz/${quiz.id}/join`;
                    navigator.clipboard.writeText(url);
                    alert('Quiz link copied to clipboard!');
                  }}
                  className="w-full mt-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-600 rounded-lg hover:bg-blue-50"
                >
                  Copy Join Link
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
