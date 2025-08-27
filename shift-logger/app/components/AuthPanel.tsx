import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthPanelProps {
  onAuthSuccess: (user: User, token: string) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ onAuthSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    const action = isRegistering ? 'register' : 'login';
    if (!username || !password || (isRegistering && !fullName)) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const payload = isRegistering ? { username, password, fullName } : { username, password };
      const { data } = await api.post<{ user: User; token: string }>(`/auth/${action}`, payload);
      onAuthSuccess(data.user, data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <section className="card section">
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <div className="row">
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label className="muted">Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
        </div>
        {isRegistering && (
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label className="muted">Full Name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" />
          </div>
        )}
        <div style={{ flex: 1, minWidth: '160px' }}>
          <label className="muted">Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        </div>
      </div>
      {error && <p style={{ color: 'var(--red)', textAlign: 'center', marginTop: '10px' }}>{error}</p>}
      <div className="toolbar" style={{ marginTop: '10px', flexDirection: 'column' }}>
        <button onClick={handleAction} disabled={loading} className="bigbtn" style={{ maxWidth: '320px' }}>
          {loading ? 'Working...' : (isRegistering ? 'Register' : 'Login')}
        </button>
        <button onClick={() => setIsRegistering(!isRegistering)} disabled={loading} className="bigbtn ghost" style={{ maxWidth: '320px', fontSize: '14px' }}>
          {isRegistering ? 'Already have an account? Login' : "Don't have an account? Register"}
        </button>
      </div>
    </section>
  );
};

export default AuthPanel;
