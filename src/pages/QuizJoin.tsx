import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Quiz } from '../lib/supabase';
import { UserCircle, Building, Hash } from 'lucide-react';

export default function QuizJoin() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!quizId) return;

    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    if (!quizId) return;

    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) throw error;
      setQuiz(data);

      if (data.ended) {
        navigate(`/quiz/${quizId}/leaderboard`);
      }
    } catch (err) {
      setError('Quiz not found');
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizId) return;

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('participants')
        .insert({
          quiz_id: quizId,
          name,
          department,
          employee_code: employeeCode
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          setError('This employee code is already registered for this quiz');
        } else {
          throw error;
        }
        setLoading(false);
        return;
      }

      localStorage.setItem(`participant-${quizId}`, data.id);

      if (quiz?.started) {
        navigate(`/quiz/${quizId}/play`);
      } else {
        navigate(`/quiz/${quizId}/wait`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join quiz');
      setLoading(false);
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center">
        <div className="text-white text-xl">{error || 'Loading...'}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.name}</h1>
          <p className="text-gray-600">Enter your details to join</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4" />
                Full Name
              </div>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Department
              </div>
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4" />
                Employee Code
              </div>
            </label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 mt-6"
          >
            {loading ? 'Joining...' : 'Join Quiz'}
          </button>
        </form>
      </div>
    </div>
  );
}
