import React from 'react';
import type { Shift } from '@/types';
import { api } from '@/lib/api';

interface DashboardProps {
  activeShift: Shift | null;
  onNewShift: () => void;
  onNewEntry: () => void;
  isEntryInProgress: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ activeShift, onNewShift, onNewEntry, isEntryInProgress }) => {
  
  const handleEndShift = async () => {
    if (!activeShift) return alert('No active shift.');

    if (!activeShift.entries || activeShift.entries.length === 0) {
        alert('Cannot generate a summary for an empty shift log.');
        return;
    }

    const body = activeShift.entries.map(e => e.text).join('\n');
    try {
      const summaryResponse = await api.post<{ text: string }>('/ai/summary', {
        date: activeShift.date,
        timings: activeShift.timings,
        designation: activeShift.designation,
        body,
      });
      const summaryText = summaryResponse.data.text;

      await api.post(`/shifts/${activeShift._id}/summary`, { summary: summaryText });
      
      const fullReport = `Shift Summary\nDate: ${activeShift.date}\n\n${summaryText}\n\n---\nFull Log:\n${body}`;
      navigator.clipboard.writeText(fullReport);
      alert('AI shift summary generated and saved to database! Copied to clipboard.');
    
    } catch (error) {
      alert('Failed to generate or save summary.');
    }
  };

  return (
    <section className="card section">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="toolbar">
          <span className="chip">Date: <strong style={{ marginLeft: '6px' }}>{activeShift?.date || 'N/A'}</strong></span>
          <span className="chip">Shift: <strong style={{ marginLeft: '6px' }}>{activeShift?.timings || 'N/A'}</strong></span>
          <span className="chip">Designation: <strong style={{ marginLeft: '6px' }}>{activeShift?.designation || 'N/A'}</strong></span>
        </div>
        <button onClick={onNewShift} className="bigbtn ghost" style={{ maxWidth: '220px', margin: 0 }}>New / Load Shift</button>
      </div>
      <div style={{ marginTop: '8px' }}>
        <button onClick={onNewEntry} className="bigbtn" disabled={!activeShift || isEntryInProgress}>
          {isEntryInProgress ? 'Log in Progress...' : '➕ New Entry'}
        </button>
        <button onClick={handleEndShift} className="bigbtn dark" disabled={!activeShift}>✅ End Shift Summary</button>
      </div>
    </section>
  );
};

export default Dashboard;
