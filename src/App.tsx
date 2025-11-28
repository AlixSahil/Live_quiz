import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import CreateQuiz from './pages/CreateQuiz';
import QuizMonitor from './pages/QuizMonitor';
import QuizJoin from './pages/QuizJoin';
import QuizWait from './pages/QuizWait';
import QuizPlay from './pages/QuizPlay';
import QuizLeaderboard from './pages/QuizLeaderboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/admin/login" />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/create-quiz" element={<CreateQuiz />} />
          <Route path="/admin/quiz/:quizId/monitor" element={<QuizMonitor />} />
          <Route path="/quiz/:quizId/join" element={<QuizJoin />} />
          <Route path="/quiz/:quizId/wait" element={<QuizWait />} />
          <Route path="/quiz/:quizId/play" element={<QuizPlay />} />
          <Route path="/quiz/:quizId/leaderboard" element={<QuizLeaderboard />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
