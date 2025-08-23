import React from 'react';
import { api } from '../lib/api';
import type { Shift } from '../types';

interface DashboardProps {
  currentShift: Shift | null;
  setCurrentShift: React.Dispatch<React.SetStateAction<Shift | null>>;
  onViewLogs: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ currentShift, setCurrentShift, onViewLogs }) => {
  const handleEndShift = async () => {
      if (!currentShift) return alert('No active shift to end.');
      try {
        const { data } = await api.post<{ summary: string }>('/ai/summary', { shift: currentShift });
        const textToCopy = `Date: ${currentShift.date}\nShift: ${currentShift.timings}\nDesignation: ${currentShift.designation}\n\nSUMMARY:\n${data.summary}\n\nFULL LOG:\n${(currentShift.entries || []).join('\n')}`;
        await navigator.clipboard.writeText(textToCopy);
        alert('AI shift summary copied to clipboard!');
      } catch (error) {
        alert('Failed to generate AI summary.');
        console.error(error);
      }
  };

  return (
    <section id="dash" className="card section">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="toolbar">
          <span className="chip">Date: <strong style={{ marginLeft: '6px' }}>{currentShift?.date || 'N/A'}</strong></span>
          <span className="chip">Shift: <strong style={{ marginLeft: '6px' }}>{currentShift?.timings || 'N/A'}</strong></span>
          <span className="chip">Designation: <strong style={{ marginLeft: '6px' }}>{currentShift?.designation || 'N/A'}</strong></span>
          <span className="chip"><span className="green">●</span>Ready</span>
        </div>
        <button className="bigbtn ghost" style={{ maxWidth: '220px' }}>
          New / Load Shift
        </button>
      </div>
      <div style={{ marginTop: '8px' }}>
        <button className="bigbtn" disabled={!currentShift}>➕ New Entry</button>
        <button onClick={onViewLogs} className="bigbtn dark">🗂️ View Logs</button>
        <button onClick={handleEndShift} className="bigbtn" disabled={!currentShift}>✅ End Shift (AI Summary)</button>
      </div>
    </section>
  );
};

export default Dashboard;