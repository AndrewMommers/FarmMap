import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import { Wheat, Eye, EyeOff, Loader2 } from 'lucide-react';

/**
 * Landed on from a team-invite email link. By the time this renders,
 * supabase-js has already exchanged the invite token in the URL for a
 * session (it auto-detects this on load), same mechanism as password
 * recovery — see ResetPasswordPage.tsx. Unlike that page, this one does NOT
 * sign out afterward: the whole point is joining the farm, so once the
 * password is set and the farm_users row is claimed, it navigates straight
 * into the app.
 */
export function AcceptInvitePage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError("Passwords don't match"); return; }

    setLoading(true);
    try {
      const pwErr = await updatePassword(password);
      if (pwErr) { setError(pwErr); return; }

      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user?.email) { setError('Could not confirm your account — try opening the invite link again.'); return; }

      const farmId = user.user_metadata?.farm_id as string | undefined;
      if (!farmId) {
        setError("This invite link is missing some information — ask whoever invited you to send a new one.");
        return;
      }

      // Claim the pending farm_users row — allowed by the
      // farm_users_claim_own_invite policy, which only lets a user claim an
      // unlinked row matching their own verified email. Supabase silently
      // affects zero rows (no error) if RLS blocks/filters everything out,
      // so an empty result here is treated as a real failure, not success.
      const { data: claimed, error: claimErr } = await supabase
        .from('farm_users')
        .update({ user_id: user.id })
        .eq('farm_id', farmId)
        .is('user_id', null)
        .select('id');
      if (claimErr) { setError(claimErr.message); return; }
      if (!claimed || claimed.length === 0) {
        setError("This invite has already been used or has expired — ask whoever invited you to send a new one.");
        return;
      }

      navigate('/', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-farm-900 via-farm-800 to-earth-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-farm-500 mb-4 shadow-lg">
            <Wheat className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">FarmMap</h1>
          <p className="text-farm-300 mt-1">You've been invited to join a farm</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Set a password to finish joining the team.
            </p>
            <div>
              <label className="label">Password</label>
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
              <label className="label">Confirm password</label>
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Join the Farm'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
