import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import api from '../../utils/api';

function getMyStaffId() {
  try {
    const token = sessionStorage.getItem('staffToken');
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.staffId;
  } catch {
    return null;
  }
}

const ROLES = ['OWNER', 'MANAGER', 'STAFF'];

export default function StaffSettingsStaffPage() {
  const staffRole = sessionStorage.getItem('staffRole');
  const isOwner = staffRole === 'OWNER';
  const myId = getMyStaffId();

  const [staffList, setStaffList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState('');

  const [newAccount, setNewAccount] = useState({ username: '', password: '', name: '', role: 'STAFF', jobTitle: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [myProfile, setMyProfile] = useState({ name: '', jobTitle: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState('');

  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [isResetting, setIsResetting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const [rowError, setRowError] = useState({});
  const [rowJobTitle, setRowJobTitle] = useState({});

  const loadStaff = () => {
    setIsLoading(true);
    api.get('/api/staff')
      .then(res => {
        setStaffList(res.data);
        setListError('');
        const me = res.data.find(s => s._id === myId);
        if (me) setMyProfile({ name: me.name, jobTitle: me.jobTitle || '' });
        const titles = {};
        res.data.forEach(s => { titles[s._id] = s.jobTitle || ''; });
        setRowJobTitle(titles);
      })
      .catch(err => setListError(err.message || 'Could not load staff accounts.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    if (isOwner) loadStaff();
  }, [isOwner]);

  const handleCreate = async () => {
    setCreateError('');
    if (!newAccount.username.trim() || !newAccount.password || !newAccount.name.trim()) {
      setCreateError('Username, password, and name are all required.');
      return;
    }
    setIsCreating(true);
    try {
      await api.post('/api/staff', newAccount);
      setNewAccount({ username: '', password: '', name: '', role: 'STAFF', jobTitle: '' });
      loadStaff();
    } catch (err) {
      setCreateError(err.message || 'Could not create account.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    if (!myProfile.name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    setIsSavingProfile(true);
    try {
      await api.patch(`/api/staff/${myId}`, { name: myProfile.name, jobTitle: myProfile.jobTitle });
      setProfileSaved('Saved.');
      setTimeout(() => setProfileSaved(''), 3000);
      loadStaff();
    } catch (err) {
      setProfileError(err.message || 'Could not save.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    setRowError(prev => ({ ...prev, [id]: '' }));
    try {
      await api.patch(`/api/staff/${id}`, { role });
      loadStaff();
    } catch (err) {
      setRowError(prev => ({ ...prev, [id]: err.message || 'Could not update role.' }));
    }
  };

  const handleToggleActive = async (id, active) => {
    setRowError(prev => ({ ...prev, [id]: '' }));
    try {
      await api.patch(`/api/staff/${id}`, { active });
      loadStaff();
    } catch (err) {
      setRowError(prev => ({ ...prev, [id]: err.message || 'Could not update status.' }));
    }
  };

  const handleJobTitleBlur = async (id) => {
    const current = staffList.find(s => s._id === id);
    const newTitle = rowJobTitle[id] || '';
    if (!current || newTitle === (current.jobTitle || '')) return;
    setRowError(prev => ({ ...prev, [id]: '' }));
    try {
      await api.patch(`/api/staff/${id}`, { jobTitle: newTitle });
      loadStaff();
    } catch (err) {
      setRowError(prev => ({ ...prev, [id]: err.message || 'Could not update job title.' }));
    }
  };

  const handleResetPassword = async () => {
    setResetError('');
    if (!resetPassword || resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters.');
      return;
    }
    setIsResetting(true);
    try {
      await api.patch(`/api/staff/${resetTarget._id}/password`, { password: resetPassword });
      setResetTarget(null);
      setResetPassword('');
    } catch (err) {
      setResetError(err.message || 'Could not reset password.');
    } finally {
      setIsResetting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteError('');
    setIsDeleting(true);
    try {
      await api.delete(`/api/staff/${deleteTarget._id}`);
      setDeleteTarget(null);
      loadStaff();
    } catch (err) {
      setDeleteError(err.message || 'Could not delete account.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOwner) {
    return <Navigate to="/staff/settings" replace />;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <Link to="/staff/settings" className="text-xs font-semibold text-saffron-gold uppercase tracking-widest">&larr; Back to Settings</Link>

      {/* My Profile — name/job title only, never role/active */}
      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">My Profile</h2>
        <p className="text-xs text-subtle-text mb-5">
          Your own display name and job title. Role and active status can't be changed here — ask another Owner if that's ever needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:flex-1">
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Name</span>
            <input
              type="text"
              value={myProfile.name}
              onChange={(e) => setMyProfile(prev => ({ ...prev, name: e.target.value }))}
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <div className="w-full sm:flex-1">
            <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Job Title (e.g. Cook, Waiter, Cashier)</span>
            <input
              type="text"
              value={myProfile.jobTitle}
              onChange={(e) => setMyProfile(prev => ({ ...prev, jobTitle: e.target.value }))}
              className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
        </div>
        {profileError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{profileError}</p>
        )}
        {profileSaved && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-2 mt-4">{profileSaved}</p>
        )}
        <button
          onClick={handleSaveProfile}
          disabled={isSavingProfile}
          className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSavingProfile ? 'Saving...' : 'Save My Profile'}
        </button>
      </div>

      {/* Add Account */}
      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-1">Add a Staff Account</h2>
        <p className="text-xs text-subtle-text mb-5">
          Replaces running seedStaff.js from Render's shell — creates a real login immediately.
        </p>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newAccount.username}
              onChange={(e) => setNewAccount(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Username"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <input
              type="text"
              value={newAccount.name}
              onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Full name"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="password"
              value={newAccount.password}
              onChange={(e) => setNewAccount(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Password (min. 8 characters)"
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
            />
            <select
              value={newAccount.role}
              onChange={(e) => setNewAccount(prev => ({ ...prev, role: e.target.value }))}
              className="w-full sm:flex-1 border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold bg-white"
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <input
            type="text"
            value={newAccount.jobTitle}
            onChange={(e) => setNewAccount(prev => ({ ...prev, jobTitle: e.target.value }))}
            placeholder="Job title (optional, e.g. Cook, Waiter, Cashier)"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
        </div>

        {createError && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-4">{createError}</p>
        )}

        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full mt-5 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[48px] flex items-center justify-center uppercase tracking-widest hover:brightness-110 active:scale-98 transition-all duration-300 shadow-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {isCreating ? 'Creating...' : 'Create Account'}
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white border border-muted-border p-6 mt-6">
        <h2 className="font-serif text-xl text-ink-navy font-semibold mb-5">All Accounts</h2>

        {isLoading && <p className="text-sm text-subtle-text">Loading...</p>}
        {listError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2">{listError}</p>}

        {!isLoading && !listError && (
          <div className="space-y-4">
            {staffList.map((s) => {
              const isMe = s._id === myId;
              return (
                <div key={s._id} className="border border-muted-border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-navy">
                        {s.name} {isMe && <span className="text-saffron-gold text-xs">(You)</span>}
                      </p>
                      <p className="text-xs text-subtle-text">
                        @{s.username} &middot; {s.active ? 'Active' : 'Deactivated'}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={s.role}
                        disabled={isMe}
                        onChange={(e) => handleRoleChange(s._id, e.target.value)}
                        className="border border-muted-border px-2 h-9 text-xs focus:outline-none focus:border-saffron-gold bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>

                      <button
                        disabled={isMe}
                        onClick={() => handleToggleActive(s._id, !s.active)}
                        className={`px-3 h-9 text-xs uppercase tracking-widest border disabled:opacity-40 disabled:cursor-not-allowed ${
                          s.active
                            ? 'border-red-200 text-red-600 hover:bg-red-50'
                            : 'border-green-200 text-green-700 hover:bg-green-50'
                        }`}
                      >
                        {s.active ? 'Deactivate' : 'Reactivate'}
                      </button>

                      <button
                        disabled={isMe}
                        onClick={() => { setResetTarget(s); setResetPassword(''); setResetError(''); }}
                        className="px-3 h-9 text-xs uppercase tracking-widest border border-muted-border text-ink-navy hover:border-saffron-gold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Reset Password
                      </button>

                      <button
                        disabled={isMe}
                        onClick={() => { setDeleteTarget(s); setDeleteError(''); }}
                        className="px-3 h-9 text-xs uppercase tracking-widest border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="text-[11px] text-subtle-text uppercase tracking-wide block mb-1">Job Title</span>
                    <input
                      type="text"
                      value={rowJobTitle[s._id] ?? ''}
                      onChange={(e) => setRowJobTitle(prev => ({ ...prev, [s._id]: e.target.value }))}
                      onBlur={() => handleJobTitleBlur(s._id)}
                      placeholder="e.g. Cook, Waiter, Cashier"
                      className="w-full sm:w-64 border border-muted-border px-3 h-9 text-sm focus:outline-none focus:border-saffron-gold"
                    />
                  </div>

                  {rowError[s._id] && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-3">{rowError[s._id]}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reset Password */}
      {resetTarget && (
        <div className="bg-white border border-muted-border p-6 mt-6">
          <h3 className="font-serif text-lg text-ink-navy mb-1">Reset password for {resetTarget.name}</h3>
          <p className="text-xs text-subtle-text mb-4">They'll need to use this new password on their next login.</p>
          <input
            type="password"
            value={resetPassword}
            onChange={(e) => setResetPassword(e.target.value)}
            placeholder="New password (min. 8 characters)"
            className="w-full border border-muted-border px-3 h-10 text-sm focus:outline-none focus:border-saffron-gold"
          />
          {resetError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mt-3">{resetError}</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleResetPassword}
              disabled={isResetting}
              className="flex-1 bg-saffron-gold text-ink-navy font-cta-label text-cta-label h-[44px] uppercase tracking-widest hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isResetting ? 'Saving...' : 'Save New Password'}
            </button>
            <button
              onClick={() => setResetTarget(null)}
              className="px-6 h-[44px] border border-muted-border text-ink-navy text-xs uppercase tracking-widest hover:border-saffron-gold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="bg-white border border-red-300 p-6 mt-6">
          <h3 className="font-serif text-lg text-ink-navy mb-1">Delete {deleteTarget.name}'s account?</h3>
          <p className="text-xs text-subtle-text mb-4">
            This is permanent — unlike Deactivate, there's no undo. Past invoices generated by this
            account keep their record of who generated them either way; only the login itself is removed.
          </p>
          {deleteError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 mb-4">{deleteError}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-600 text-white font-cta-label text-cta-label h-[44px] uppercase tracking-widest hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-6 h-[44px] border border-muted-border text-ink-navy text-xs uppercase tracking-widest hover:border-saffron-gold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}