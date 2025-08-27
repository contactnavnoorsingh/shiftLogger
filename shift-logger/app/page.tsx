'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Shift, Entry, QueuedItem } from '@/types';
import { api } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';

import Header from '@/app/components/Header';
import AuthPanel from '@/app/components/AuthPanel';
import Dashboard from '@/app/components/Dashboard';
import LogsPanel from '@/app/components/LogsPanel';
import ShiftModal from '@/app/components/modals/ShiftModal';
import EntryStepperModal from '@/app/components/modals/EntryStepperModal';
import ManualEntryModal from '@/app/components/modals/ManualEntryModal';
import InProgressLogCard from '@/app/components/InProgressLogCard';
import EditEntryModal from '@/app/components/modals/EditEntryModal';
import EndShiftModal from '@/app/components/modals/EndShiftModal';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [syncStatus, setSyncStatus] = useState<'Online' | 'Offline' | 'Synced' | 'Queued'>('Online');
  
  const [isShiftModalOpen, setShiftModalOpen] = useState(false);
  const [isEntryModalOpen, setEntryModalOpen] = useState(false);
  const [isManualEntryModalOpen, setManualEntryModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEndShiftModalOpen, setIsEndShiftModalOpen] = useState(false);

  const [entryToEdit, setEntryToEdit] = useState<{ entry: Entry, index: number } | null>(null);
  const [isEndingShift, setIsEndingShift] = useState(false);

  const [inProgressEntry, setInProgressEntry] = useState<Entry | null>(null);
  const [inProgressEntryIndex, setInProgressEntryIndex] = useState<number | null>(null);
  
  const router = useRouter();

  const findInProgressEntry = (shift: Shift | null) => {
      if (!shift) return;
      const index = shift.entries.findIndex(e => e.inProgress);
      if (index !== -1) {
          setInProgressEntry(shift.entries[index]);
          setInProgressEntryIndex(index);
      } else {
          setInProgressEntry(null);
          setInProgressEntryIndex(null);
      }
  };

  const handleAuthSuccess = (userData: User, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  };

  const handleLogout = async () => {
    try {
        await api.post('/auth/status', { status: 'Offline' });
    } catch (error) {
        console.error("Failed to update offline status.", error);
    }
    localStorage.clear();
    setUser(null);
    setActiveShift(null);
    setInProgressEntry(null);
    setInProgressEntryIndex(null);
    delete api.defaults.headers.Authorization;
    router.push('/');
  };
  
  const addEntry = async (entry: Entry) => {
      if (!activeShift) return;
      const newEntries = [...activeShift.entries, entry];
      const updatedShift = { ...activeShift, entries: newEntries };
      setActiveShift(updatedShift);
      localStorage.setItem('activeShift', JSON.stringify(updatedShift));
      findInProgressEntry(updatedShift);
      await syncEntry(entry, false, newEntries.length - 1);
  };

  const updateEntry = async (entry: Entry, index: number) => {
      if (!activeShift) return;
      const newEntries = [...activeShift.entries];
      newEntries[index] = entry;
      const updatedShift = { ...activeShift, entries: newEntries };
      setActiveShift(updatedShift);
      localStorage.setItem('activeShift', JSON.stringify(updatedShift));
      findInProgressEntry(updatedShift);
      await syncEntry(entry, true, index);
  };

  const editEntry = async (newText: string, newTime: string) => {
    if (!activeShift || !entryToEdit) return;
    const { index } = entryToEdit;
    
    const newEntries = [...activeShift.entries];
    newEntries[index].text = newText;
    newEntries[index].time = newTime;
    const updatedShift = { ...activeShift, entries: newEntries };
    setActiveShift(updatedShift);
    localStorage.setItem('activeShift', JSON.stringify(updatedShift));

    try {
        await api.put(`/shifts/${activeShift._id}/entries/${index}`, { updatedText: newText, updatedTime: newTime });
        setSyncStatus('Synced');
    } catch (error) {
        alert('Failed to save edit to server. Please sync again.');
    }
    setIsEditModalOpen(false);
    setEntryToEdit(null);
  };

  const deleteEntry = async (entryIndex: number) => {
      if (!activeShift) return;
      const newEntries = activeShift.entries.filter((_, index) => index !== entryIndex);
      const updatedShift = { ...activeShift, entries: newEntries };
      setActiveShift(updatedShift);
      localStorage.setItem('activeShift', JSON.stringify(updatedShift));
      findInProgressEntry(updatedShift);

      try {
          await api.delete(`/shifts/${activeShift._id}/entries/${entryIndex}`);
          setSyncStatus('Synced');
      } catch (error) {
          alert('Failed to delete entry on server. Please sync again.');
      }
  };

  const handleEndShiftConfirm = async (confirmationName: string) => {
    if (!activeShift || !user) return;
    setIsEndingShift(true);

    const body = activeShift.entries.map(e => e.text).join('\n');
    try {
      const summaryResponse = await api.post<{ text: string }>('/ai/summary', {
        date: activeShift.date,
        timings: activeShift.timings,
        designation: activeShift.designation,
        body,
      });
      const summaryText = summaryResponse.data.text;

      const { data } = await api.post<{ shift: Shift }>(`/shifts/${activeShift._id}/end`, { summary: summaryText, confirmationName });
      
      setActiveShift(data.shift);
      localStorage.setItem('activeShift', JSON.stringify(data.shift));
      setIsEndShiftModalOpen(false);
      
      const fullReport = `Guard: ${user.fullName}\nDate: ${activeShift.date}\n\n${summaryText}\n\n---\nFull Log:\n${body}`;
      copyToClipboard(fullReport);
      
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to end shift.');
    } finally {
        setIsEndingShift(false);
    }
  };

  const syncEntry = async (entry: Entry, isUpdate: boolean, entryIndex: number) => {
      if (!activeShift) return;
      if (navigator.onLine) {
          try {
              await api.post(`/shifts/${activeShift._id}/entries`, { entry, isUpdate, entryIndex });
              setSyncStatus('Synced');
          } catch (error) {
              queueOp({ shiftId: activeShift._id, entry, isUpdate, entryIndex });
          }
      } else {
          queueOp({ shiftId: activeShift._id, entry, isUpdate, entryIndex });
      }
  };

  const queueOp = (item: QueuedItem) => {
      const queue = JSON.parse(localStorage.getItem('queue') || '[]') as QueuedItem[];
      queue.push(item);
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
        await api.post(`/shifts/${item.shiftId}/entries`, item);
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
            if (data.shift) {
                setActiveShift(data.shift);
                findInProgressEntry(data.shift);
            }
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
        const shiftData = JSON.parse(storedShift);
        setActiveShift(shiftData);
        findInProgressEntry(shiftData);
      }
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => { setSyncStatus('Online'); flushQueue(); };
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
              onEndShift={() => setIsEndShiftModalOpen(true)}
              isEntryInProgress={!!inProgressEntry}
            />
            {inProgressEntry && (
                <InProgressLogCard 
                    entry={inProgressEntry}
                    onContinue={() => setEntryModalOpen(true)}
                />
            )}
            <LogsPanel 
                activeShift={activeShift} 
                onDeleteEntry={deleteEntry}
                onEditEntry={(entry, index) => {
                    setEntryToEdit({ entry, index });
                    setIsEditModalOpen(true);
                }}
                userFullName={user.fullName}
            />
          </>
        )}
      </main>

      {isShiftModalOpen && <ShiftModal onClose={() => setShiftModalOpen(false)} onShiftLoaded={(shift) => { setActiveShift(shift); localStorage.setItem('activeShift', JSON.stringify(shift)); setShiftModalOpen(false); findInProgressEntry(shift); }} />}
      {isEntryModalOpen && activeShift && <EntryStepperModal shift={activeShift} onClose={() => setEntryModalOpen(false)} onEntryCreated={addEntry} onEntryUpdated={updateEntry} inProgressEntry={inProgressEntry} inProgressEntryIndex={inProgressEntryIndex} />}
      {isManualEntryModalOpen && activeShift && <ManualEntryModal onClose={() => setManualEntryModalOpen(false)} onEntryCreated={addEntry} />}
      {isEditModalOpen && entryToEdit && <EditEntryModal entry={entryToEdit.entry} onClose={() => setIsEditModalOpen(false)} onSave={editEntry} />}
      {isEndShiftModalOpen && user && <EndShiftModal userFullName={user.fullName} onClose={() => setIsEndShiftModalOpen(false)} onConfirm={handleEndShiftConfirm} isEnding={isEndingShift} />}

      {user && activeShift && activeShift.status === 'Active' && (
          <button onClick={() => setManualEntryModalOpen(true)} style={{ position: 'fixed', bottom: '20px', right: '20px', width: '60px', height: '60px', borderRadius: '50%', background: 'var(--red)', border: 'none', boxShadow: 'var(--shadow)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 1000, }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </button>
      )}
    </>
  );
}
