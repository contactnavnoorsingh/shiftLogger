import React from 'react';
import type { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header>
      <div className="brand">
        <div className="dot"></div>
        <h1>Tactical Shift Log</h1>
      </div>
      {user && (
        <div className="row">
          <span id="who" className="muted">@{user.username}</span>
          <button onClick={onLogout} className="bigbtn ghost" style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '10px' }}>
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;