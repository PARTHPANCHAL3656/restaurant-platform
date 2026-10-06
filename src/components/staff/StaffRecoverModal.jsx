import React, { useState } from 'react';
import api from '../../utils/api';

// "Reset Access" on the staff login page. The owner is locked out, so there is
// no session: they prove who they are with a one-time recovery code from the
// printed sheet. The server answers every failure with the same message.
export default function StaffRecoverModal({ initialUsername = '', onClose, onDone }) {
  const [username, setUsername] = useState(initialUsername);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [finished, setFinished] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !code.trim() || !newPassword) {
      setError('Fill in every field.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/auth/recover', {
        username: username.trim(),
        code: code.trim(),
        newPassword
      });
      setFinished(true);
    } catch (err) {
      setError(err.message || 'Could not reset access.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-transparent border-b border-canvas-cream/20 py-3 focus:outline-none focus:border-saffron-gold transition-colors font-body-md text-canvas-cream outline-none';
  const labelClass = 'font-label-caps text-label-caps text-canvas-cream/40 uppercase block mb-2';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-black/95 px-6 py-8 overflow-y-auto">
      <div className="w-full max-w-[440px] bg-ink-navy border border-muted-border/10 p-8 shadow-2xl rounded-sm">
        {finished ? (
          <div className="text-center space-y-6">
            <p className="font-label-caps text-[10px] text-saffron-gold tracking-[0.2em] uppercase font-bold">
              Access restored
            </p>
            <p className="font-sans text-sm text-canvas-cream/80 leading-relaxed">
              Your password has been reset and every other session was signed out. Sign in with your new password.
            </p>
            <button
              type="button"
              onClick={() => onDone(username.trim())}
              className="w-full h-[52px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all cursor-pointer"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <p className="font-label-caps text-[10px] text-saffron-gold tracking-[0.2em] uppercase font-bold">
                Reset Owner Access
              </p>
              <p className="font-sans text-[11px] text-canvas-cream/50 leading-relaxed mt-2">
                Enter one of the recovery codes from your printed sheet. Each code works once. Managers and staff should ask an Owner to reset their password.
              </p>
            </div>

            {error && (
              <div className="p-3.5 bg-red-900/20 border border-red-500/30 text-red-300 text-xs font-sans tracking-wide">
                {error}
              </div>
            )}

            <div>
              <label className={labelClass}>Owner username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                autoComplete="username"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Recovery code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(''); }}
                placeholder="XXXX-XXXX-XXXX-XXXX"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={`${inputClass} font-mono tracking-widest`}
              />
            </div>

            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(''); }}
                autoComplete="new-password"
                className={inputClass}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-[52px] bg-saffron-gold text-ink-navy font-cta-label text-cta-label uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? 'Resetting...' : 'Reset Access'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full text-center font-label-caps text-[10px] text-canvas-cream/60 uppercase tracking-widest hover:text-saffron-gold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}
      </div>
    </div>
  );
}