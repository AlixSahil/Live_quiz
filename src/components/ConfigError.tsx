import { isSupabaseConfigured } from '../lib/supabase';

export function ConfigError() {
  if (isSupabaseConfigured) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Configuration Required
        </h2>
        <p className="text-gray-600 text-center mb-4">
          Supabase environment variables are not configured.
        </p>
        <div className="bg-gray-50 rounded p-4 mb-4">
          <p className="text-sm text-gray-700 mb-2">
            Please set the following environment variables in your Netlify deployment settings:
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_URL</code></li>
            <li>• <code className="bg-gray-200 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
          </ul>
        </div>
        <div className="text-sm text-gray-500 text-center">
          <p>Go to: Netlify Dashboard → Site Settings → Environment Variables</p>
        </div>
      </div>
    </div>
  );
}

