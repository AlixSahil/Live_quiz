# Realtime Quiz System

A complete web-based realtime quiz system where admins create custom MCQ quizzes and employees compete in rapid-fire format with live leaderboard updates.

## Features

### Admin Panel
- Secure authentication with Supabase Auth
- Create quizzes with custom multiple-choice questions
- Schedule quiz start times
- Live monitoring dashboard showing:
  - Current question
  - Number of participants
  - Real-time leaderboard updates
- Control quiz flow (start, advance questions, end)

### Employee Experience
- Simple join flow with name, department, and employee code
- Waiting room until quiz starts
- Real-time question delivery
- Rapid-fire scoring system with speed bonuses
- Live leaderboard updates
- Final results page

### Scoring System
- **Base score**: 5 points per correct answer
- **Speed bonus** (for correct answers):
  - 1st correct: +5 points (10 total)
  - 2nd correct: +4 points (9 total)
  - 3rd correct: +3 points (8 total)
  - 4th correct: +2 points (7 total)
  - 5th correct: +1 point (6 total)
  - 6th+ correct: +0 bonus (5 total)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS
- **Backend**: Supabase
  - PostgreSQL Database
  - Realtime subscriptions
  - Edge Functions for secure scoring
  - Row Level Security (RLS)
- **Icons**: Lucide React
- **Routing**: React Router

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ installed
- Supabase account

### 2. Database Setup
The database schema has been created with the following tables:
- `quizzes` - Quiz information and state
- `questions` - Quiz questions with options
- `participants` - Registered participants
- `answers` - Submitted answers with scoring

All tables have Row Level Security enabled.

### 3. Environment Variables
Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings under API.

### 4. Edge Functions
The scoring logic is handled by a Supabase Edge Function named `submit-answer` that has been deployed. This ensures secure server-side score calculation that cannot be manipulated by clients.

### 5. Install Dependencies
```bash
npm install
```

### 6. Run Development Server
```bash
npm run dev
```

### 7. Build for Production
```bash
npm run build
```

## Usage Guide

### For Admins

1. **Sign Up / Sign In**
   - Navigate to `/admin/login`
   - Create an account or sign in

2. **Create a Quiz**
   - Click "Create Quiz" from the dashboard
   - Enter quiz name and start time
   - Add questions with 4 options each
   - Mark the correct option for each question
   - Submit to create the quiz

3. **Start a Quiz**
   - From the dashboard, click "Start" on a scheduled quiz
   - This will take you to the monitoring page
   - The quiz becomes live for participants

4. **Monitor Quiz**
   - View current question
   - See participant count
   - Watch live leaderboard updates
   - Click "Next Question" to advance
   - Click "End Quiz" when finished

5. **Share Join Link**
   - From the dashboard, click "Copy Join Link" on any quiz
   - Share this link with participants

### For Participants

1. **Join Quiz**
   - Open the quiz link shared by admin
   - Enter your name, department, and employee code
   - Click "Join Quiz"

2. **Wait for Start**
   - If the quiz hasn't started, you'll see a waiting room
   - The page will automatically update when the quiz starts

3. **Answer Questions**
   - Read each question carefully
   - Select your answer
   - Click "Submit Answer"
   - Wait for the next question

4. **View Results**
   - Live leaderboard updates as you answer
   - Final results shown when quiz ends
   - See your rank and total score

## Security Features

- All database operations protected by Row Level Security
- Scoring logic runs server-side in Edge Functions
- No client-side score manipulation possible
- Participants can only submit one answer per question
- Authentication required for admin functions

## Project Structure

```
src/
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── lib/
│   └── supabase.ts           # Supabase client and types
├── pages/
│   ├── AdminLogin.tsx        # Admin authentication
│   ├── AdminDashboard.tsx    # Admin quiz management
│   ├── CreateQuiz.tsx        # Quiz creation form
│   ├── QuizMonitor.tsx       # Live quiz monitoring
│   ├── QuizJoin.tsx          # Participant registration
│   ├── QuizWait.tsx          # Waiting room
│   ├── QuizPlay.tsx          # Active quiz gameplay
│   └── QuizLeaderboard.tsx   # Results and rankings
├── App.tsx                   # Main app with routing
└── main.tsx                  # App entry point
```

## Realtime Features

The application uses Supabase Realtime for instant updates:
- Quiz start/end status
- Question advancement
- Participant join notifications
- Score updates
- Leaderboard changes

## Deployment

### Deploy to GitHub Pages (Automatic)

This repository is configured for automatic deployment to GitHub Pages.

**Live Site**: https://AlixSahil.github.io/Live_quiz/

**How it works**:
- When changes are pushed to the `main` branch, GitHub Actions automatically builds and deploys the site
- The workflow uses `peaceiris/actions-gh-pages` to publish the `dist` folder to the `gh-pages` branch
- GitHub Pages serves the site from the `gh-pages` branch

**To enable GitHub Pages** (if not already enabled):
1. Go to repository Settings → Pages
2. Set Source to "Deploy from a branch"
3. Select the `gh-pages` branch and `/ (root)` folder
4. Click Save

**Manual deployment**:
```bash
npm run deploy
```
This will build the project and deploy to the `gh-pages` branch using the `gh-pages` package.

### Deploy to Netlify

1. Build the project:
```bash
npm run build
```

2. Deploy the `dist` folder to Netlify

3. Set environment variables in Netlify:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. Configure redirect rules in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Troubleshooting

**Quiz won't start**: Ensure you clicked "Start Quiz" from the admin dashboard

**Answers not submitting**: Check that the Edge Function is deployed and environment variables are set

**Realtime updates not working**: Verify Supabase Realtime is enabled in your project settings

**Can't join quiz**: Make sure the employee code is unique for each quiz

## License

MIT
