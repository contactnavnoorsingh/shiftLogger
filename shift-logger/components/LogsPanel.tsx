import React from 'react';
import type { Shift } from '../types';

interface LogsPanelProps {
  currentShift: Shift | null;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ currentShift }) => {
  const logText = currentShift
    ? `Date: ${currentShift.date}\nShift: ${currentShift.timings}\nDesignation: ${currentShift.designation}\n\n${(currentShift.entries || []).join('\n')}`
    : 'No shift loaded.';

  const handleCopy = () => {
    navigator.clipboard.writeText(logText);
    alert('Log copied to clipboard!');
  };

  return (
    <section className="card section">
      <h2>Shift Log</h2>
      <div id="logBox">{logText}</div>
      <div className="toolbar" style={{ marginTop: '10px', justifyContent: 'space-between' }}>
        <div className="toolbar">
          <button className="bigbtn ghost" style={{ maxWidth: '160px' }}>Refresh</button>
          <button onClick={handleCopy} className="bigbtn" style={{ maxWidth: '160px' }}>Copy</button>
        </div>
        <span className="muted">Entries are synced to the server.</span>
      </div>
    </section>
  );
};

export default LogsPanel;