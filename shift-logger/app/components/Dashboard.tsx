import React from 'react';
import type { Shift } from '@/types';

interface DashboardProps {
  activeShift: Shift | null;
  onNewShift: () => void;
  onNewEntry: () => void;
  onEndShift: () => void;
  isEntryInProgress: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ activeShift, onNewShift, onNewEntry, onEndShift, isEntryInProgress }) => {
  const isShiftComplete = activeShift?.status === 'Completed';

  return (
    <section className="card section">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="toolbar">
          <span className="chip">Date: <strong style={{ marginLeft: '6px' }}>{activeShift?.date || 'N/A'}</strong></span>
          <span className="chip">Shift: <strong style={{ marginLeft: '6px' }}>{activeShift?.timings || 'N/A'}</strong></span>
          <span className="chip">Designation: <strong style={{ marginLeft: '6px' }}>{activeShift?.designation || 'N/A'}</strong></span>
        </div>
        <button 
          onClick={onNewShift} 
          className="bigbtn ghost" 
          style={{ maxWidth: '220px', margin: 0 }}
          disabled={isEntryInProgress}
        >
          {isEntryInProgress ? 'Entry in Progress' : 'New / Load Shift'}
        </button>
      </div>
      <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
        <button onClick={onNewEntry} className="bigbtn" disabled={!activeShift || isEntryInProgress || isShiftComplete}>
          {isEntryInProgress ? 'Log in Progress...' : (isShiftComplete ? 'Shift Completed' : '➕ New Entry')}
        </button>
        <button 
          onClick={onEndShift} 
          className="bigbtn dark" 
          disabled={!activeShift || isEntryInProgress || isShiftComplete}
        >
          {isShiftComplete ? 'Shift Completed' : '✅ End Shift'}
        </button>
      </div>
    </section>
  );
};

export default Dashboard;
