import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, Quiz, Participant } from '../lib/supabase';
import { Clock, Users } from 'lucide-react';

export default function QuizWait() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!quizId) return;

    const participantId = localStorage.getItem(`participant-${quizId}`);
    if (!participantId) {
      navigate(`/quiz/${quizId}/join`);
      return;
    }

    loadQuiz();
    loadParticipants();
    subscribeToUpdates();
  }, [quizId, navigate]);

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

    if (data.started && !data.ended) {
      navigate(`/quiz/${quizId}/play`);
    } else if (data.ended) {
      navigate(`/quiz/${quizId}/leaderboard`);
    }
  };

  const loadParticipants = async () => {
    if (!quizId) return;

    const { data, error } = await supabase
      .from('participants')
      .select('*')
      .eq('quiz_id', quizId)
      .order('joined_at', { ascending: false });

    if (!error && data) {
      setParticipants(data);
      setParticipantCount(data.length);
    }
  };

  const subscribeToUpdates = () => {
    if (!quizId) return;

    const channel = supabase
      .channel(`quiz-wait-${quizId}`)
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
          if (updated.started && !updated.ended) {
            navigate(`/quiz/${quizId}/play`);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `quiz_id=eq.${quizId}`
        },
        (payload) => {
          const newParticipant = payload.new as Participant;
          setParticipants((prev) => [newParticipant, ...prev]);
          setParticipantCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-12 w-full max-w-2xl text-center">
        <div className="mb-8">
          <div className="inline-block p-4 bg-blue-100 rounded-full mb-4">
            <Clock className="w-16 h-16 text-blue-600 animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {quiz?.name}
          </h1>
          <p className="text-xl text-gray-600">
            Waiting for the quiz to start...
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="w-6 h-6 text-gray-600" />
            <span className="text-3xl font-bold text-gray-800">{participantCount}</span>
          </div>
          <p className="text-gray-600">participants joined</p>
        </div>

        {quiz && (
          <div className="text-gray-600 mb-8">
            <p className="mb-2">Scheduled start time:</p>
            <p className="text-lg font-semibold text-gray-800">
              {new Date(quiz.start_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </p>
          </div>
        )}

        {participants.length > 0 && (
          <div className="mb-8 max-h-64 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Joined Participants</h3>
            <div className="space-y-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="p-3 bg-gray-100 rounded-lg text-left animate-fadeIn"
                >
                  <p className="font-medium text-gray-800">{participant.name}</p>
                  <p className="text-sm text-gray-600">
                    {participant.department} • {participant.employee_code}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Please keep this page open. The quiz will start automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
