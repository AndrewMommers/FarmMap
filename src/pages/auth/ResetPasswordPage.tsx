import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Wheat, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * Landed on from the "reset your password" email link. By the time this
 * renders, supabase-js has already exchanged the recovery token in the URL
 * for a temporary session (it auto-detects this on load) — this page just
 * asks for a new password, sets it, then signs out and sends the user to
 * /login so they authenticate fresh with the new password rather than
 * silently riding the recovery session into the app.
 */
export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { updatePassword, signOut } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    const err = await updatePassword(password);
    setLoading(false);
    if (err) { setError(err); return; }

    setDone(true);
    await signOut();
    setTimeout(() => navigate('/login', { replace: true }), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-500 mb-4 shadow-lg">
            <Wheat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FarmMap</h1>
          <p className="text-farm-300 mt-1">Set a new password</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          {done ? (
            <p className="text-sm text-farm-700 dark:text-farm-300 bg-farm-50 dark:bg-farm-900/30 rounded-lg px-3 py-3 text-center">
              Password updated. Redirecting you to sign in…
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">New password</label>
                <div className="relative">
                  <input
                    className="input pr-10"
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
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
              <div>
                <label className="label">Confirm new password</label>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
