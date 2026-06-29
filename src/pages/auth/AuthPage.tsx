import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useAppStore } from '../../store/appStore';
import { useDataStore } from '../../store/dataStore';
import { Wheat, Eye, EyeOff, Loader2, PlayCircle } from 'lucide-react';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuthStore();
  const { setDemoMode } = useAppStore();
  const { loadDemoData } = useDataStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    if (mode === 'login') {
      const err = await signIn(email, password);
      if (err) setError(err);
    } else {
      if (!name.trim()) { setError('Please enter your name'); setLoading(false); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return; }
      const err = await signUp(email, password, name);
      if (err) setError(err);
      else setInfo('Check your email to confirm your account, then sign in.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-500 mb-4 shadow-lg">
            <Wheat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FarmMap</h1>
          <p className="text-farm-300 mt-1">Australian Farm Management</p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          {/* Mode tabs */}
          <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); setInfo(''); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g. John Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  className="input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {info && (
              <p className="text-sm text-farm-700 dark:text-farm-300 bg-farm-50 dark:bg-farm-900/30 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : mode === 'login' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          {mode === 'login' && (
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
              Don&apos;t have an account?{' '}
              <button
                onClick={() => { setMode('register'); setError(''); }}
                className="text-farm-600 dark:text-farm-400 hover:underline font-medium"
              >
                Sign up free
              </button>
            </p>
          )}

          {/* Demo separator */}
          <div className="flex items-center gap-3 mt-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            <span className="text-xs text-gray-400">or</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          {/* Try Demo */}
          <button
            type="button"
            onClick={() => { loadDemoData(); setDemoMode(true); }}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-farm-300 dark:border-farm-700 text-farm-700 dark:text-farm-300 hover:bg-farm-50 dark:hover:bg-farm-900/30 font-semibold text-sm transition-colors"
          >
            <PlayCircle className="w-4 h-4" />
            Try Demo — explore with sample data
          </button>
        </div>

        <p className="text-center text-farm-400 text-xs mt-6">
          © {new Date().getFullYear()} FarmMap · Built for Australian farmers
        </p>
      </div>
    </div>
  );
}
