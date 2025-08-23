import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthPanelProps {
  onAuthSuccess: (user: User, token: string) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'login' | 'register') => {
    if (!username || !password) {
      setError('Please enter username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post<{ user: User; token: string }>(`/auth/${action}`, { username, password });
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <section className="card section">
      <h2>Login / Register</h2>
      <div className="row">
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label className="muted">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label className="muted">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      <div className="toolbar" style={{ marginTop: '10px' }}>
        <button onClick={() => handleAction('login')} disabled={loading} className="bigbtn" style={{ maxWidth: '220px' }}>
          {loading ? 'Working...' : 'Login'}
        </button>
        <button onClick={() => handleAction('register')} disabled={loading} className="bigbtn dark" style={{ maxWidth: '220px' }}>
          {loading ? 'Working...' : 'Register'}
        </button>
      </div>
    </section>
  );
};

export default AuthPanel;