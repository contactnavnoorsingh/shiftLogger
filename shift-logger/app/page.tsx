'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthPanel from '../components/AuthPanel';
import Dashboard from '../components/Dashboard';
import LogsPanel from '../components/LogsPanel';
import Header from '../components/Header';
import { api } from '../lib/api';
import type { User, Shift } from '../types';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [currentShift, setCurrentShift] = useState<Shift | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showLogs, setShowLogs] = useState<boolean>(true);

  const todayISO = () => new Date().toISOString().split('T')[0];

  const handleAuthSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    setUser(userData);
    api.defaults.headers.common['x-auth-token'] = token;
    saveLS('user', userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentShift');
    setUser(null);
    setCurrentShift(null);
    delete api.defaults.headers.common['x-auth-token'];
  };

  const loadShiftByDate = useCallback(async (date: string) => {
    if (!localStorage.getItem('token')) return;
    try {
      const { data } = await api.get<Shift>(`/shifts/${date}`);
      setCurrentShift(data);
      localStorage.setItem('currentShift', JSON.stringify(data));
    } catch (error) {
      console.log("No shift found for this date.");
      setCurrentShift(null);
      localStorage.removeItem('currentShift');
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = loadLS<User>('user');
    if (token && cachedUser) {
      api.defaults.headers.common['x-auth-token'] = token;
      setUser(cachedUser);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      const cachedShift = loadLS<Shift>('currentShift');
      if (cachedShift && cachedShift.userId === user._id) {
        setCurrentShift(cachedShift);
      } else {
        loadShiftByDate(todayISO());
      }
    }
  }, [user, loadShiftByDate]);

  const saveLS = (key: string, val: unknown) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  const loadLS = <T,>(key: string, def: T | null = null): T | null => {
    if (typeof window !== 'undefined') {
      try {
        const item = localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : def;
      } catch {
        return def;
      }
    }
    return def;
  };

  if (isLoading) {
    return <div style={{textAlign: 'center', paddingTop: '50px'}}>Loading...</div>;
  }

  return (
    <>
      <Header user={user} onLogout={handleLogout} />
      <main className="wrap">
        {!user ? (
          <AuthPanel onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            <Dashboard
              currentShift={currentShift}
              setCurrentShift={setCurrentShift}
              onViewLogs={() => setShowLogs(!showLogs)}
            />
            {showLogs && <LogsPanel currentShift={currentShift} />}
          </>
        )}
      </main>
    </>
  );
}