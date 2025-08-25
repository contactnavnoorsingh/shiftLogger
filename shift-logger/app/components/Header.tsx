import React from 'react';
import type { User } from '@/types';

interface HeaderProps {
  user: User | null;
  syncStatus: string;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, syncStatus, onLogout }) => {
  const getSyncColor = () => {
    switch(syncStatus) {
      case 'Synced':
      case 'Online':
        return 'var(--ok)';
      case 'Queued':
        return 'var(--warn)';
      default:
        return 'var(--red)';
    }
  };

  return (
    <header>
      <div className="brand">
        <div className="dot"></div>
        {/* FIX: Updated the application title */}
        <h1>Nav's Shift Logger</h1>
      </div>
      {user && (
        <div className="row">
          <span className="chip">
            <span style={{ color: getSyncColor(), marginRight: '6px' }}>●</span>
            {syncStatus}
          </span>
          <span className="muted">@{user.username}</span>
          <button onClick={onLogout} className="bigbtn ghost" style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '10px', margin: 0 }}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;
