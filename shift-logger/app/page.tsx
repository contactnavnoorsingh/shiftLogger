'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User, Shift, Entry } from '@/types';
import { api } from '@/lib/api';
import { todayISO } from '@/lib/utils';

import Header from '@/app/components/Header';
import AuthPanel from '@/app/components/AuthPanel';
import Dashboard from '@/app/components/Dashboard';
import LogsPanel from '@/app/components/LogsPanel';
import ShiftModal from '@/app/components/modals/ShiftModal';
import EntryStepperModal from '@/app/components/modals/EntryStepperModal';
import Floating10FourCard from '@/app/components/Floating10FourCard';

// Updated QueuedItem to use shiftId
interface QueuedItem {
  shiftId: string;
  entry: Entry;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [syncStatus, setSyncStatus] = useState<'Online' | 'Offline' | 'Synced' | 'Queued'>('Online');
  const [isShiftModalOpen, setShiftModalOpen] = useState(false);
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [pending10Index, setPending10Index] = useState<number | null>(null);

  const handleAuthSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setActiveShift(null);
    setPending10Index(null);
    delete api.defaults.headers.Authorization;
  };
  
  const addEntry = async (entry: Entry) => {
      if (!activeShift) return;

      const newEntries = [...activeShift.entries, entry];
      const updatedShift = { ...activeShift, entries: newEntries };
      setActiveShift(updatedShift);
      localStorage.setItem('activeShift', JSON.stringify(updatedShift));
      setPending10Index(newEntries.length - 1);

      if (navigator.onLine) {
          try {
              // Use shift._id instead of date
              const { data } = await api.post<{ shift: Shift }>(`/shifts/${activeShift._id}/entries`, { entry });
              setActiveShift(data.shift);
              localStorage.setItem('activeShift', JSON.stringify(data.shift));
              setSyncStatus('Synced');
          } catch (error) {
              queueEntry(entry);
          }
      } else {
          queueEntry(entry);
      }
  };

  const queueEntry = (entry: Entry) => {
      if (!activeShift) return;
      const queue = JSON.parse(localStorage.getItem('queue') || '[]') as QueuedItem[];
      // Use shiftId in the queue item
      queue.push({ shiftId: activeShift._id, entry });
      localStorage.setItem('queue', JSON.stringify(queue));
      setSyncStatus('Queued');
  };

  const flushQueue = useCallback(async () => {
    let queue = JSON.parse(localStorage.getItem('queue') || '[]') as QueuedItem[];
    if (queue.length === 0) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const failedItems: QueuedItem[] = [];

    for (const item of queue) {
      try {
        // Use shiftId from the queued item
        await api.post(`/shifts/${item.shiftId}/entries`, { entry: item.entry });
      } catch (error) {
        failedItems.push(item);
      }
    }

    localStorage.setItem('queue', JSON.stringify(failedItems));
    if (failedItems.length === 0) {
      setSyncStatus('Synced');
      if (activeShift) {
        try {
            const { data } = await api.get<{ shift: Shift | null }>(`/shifts/${activeShift._id}`);
            if (data.shift) setActiveShift(data.shift);
        } catch {}
      }
    }
  }, [activeShift]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (token && storedUser) {
      const userData: User = JSON.parse(storedUser);
      setUser(userData);
      api.defaults.headers.Authorization = `Bearer ${token}`;
      
      const storedShift = localStorage.getItem('activeShift');
      if (storedShift) {
        setActiveShift(JSON.parse(storedShift));
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus('Online');
      flushQueue();
    };
    const handleOffline = () => setSyncStatus('Offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [flushQueue]);

  return (
    <>
      <Header user={user} syncStatus={syncStatus} onLogout={handleLogout} />
      <main className="wrap">
        {!user ? (
          <AuthPanel onAuthSuccess={handleAuthSuccess} />
        ) : (
          <>
            <Dashboard
              activeShift={activeShift}
              onNewShift={() => setShiftModalOpen(true)}
              onNewEntry={() => setEntryModalOpen(true)}
            />
            <LogsPanel activeShift={activeShift} />
          </>
        )}
      </main>

      {isShiftModalOpen && (
        <ShiftModal
          onClose={() => setShiftModalOpen(false)}
          onShiftLoaded={(shift) => {
            setActiveShift(shift);
            localStorage.setItem('activeShift', JSON.stringify(shift));
            setShiftModalOpen(false);
          }}
        />
      )}
      
      {isEntryModalOpen && activeShift && (
          <EntryStepperModal
              shiftId={activeShift._id}
              onClose={() => setEntryModalOpen(false)}
              onEntryCreated={addEntry}
          />
      )}

      {pending10Index !== null && activeShift && activeShift.entries[pending10Index] && (
        <Floating10FourCard
          entry={activeShift.entries[pending10Index]}
          entryIndex={pending10Index}
          shiftId={activeShift._id}
          onDismiss={() => setPending10Index(null)}
          onUpdate={(updatedShift) => setActiveShift(updatedShift)}
        />
      )}
    </>
  );
}