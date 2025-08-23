import React from 'react';
import type { Shift } from '@/types';

interface LogsPanelProps {
  activeShift: Shift | null;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ activeShift }) => {
  const fullLogText = activeShift
    ? `Date: ${activeShift.date}\nShift: ${activeShift.timings}\nDesignation: ${activeShift.designation}\n\n${(activeShift.entries || []).map(e => e.text).join('\n')}`
    : 'No shift loaded.';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLogText);
    alert('Log copied to clipboard!');
  };

  const handleShare = () => {
      if (navigator.share) {
          navigator.share({ title: 'Shift Log', text: fullLogText });
      } else {
          const url = `https://wa.me/?text=${encodeURIComponent(fullLogText)}`;
          window.open(url, '_blank');
      }
  };

  return (
    <section className="card section">
      <h2>Shift Log</h2>
      <div id="logBox">{fullLogText}</div>
      <div className="toolbar" style={{ marginTop: '10px', justifyContent: 'space-between' }}>
        <div className="toolbar">
          <button onClick={handleCopy} className="bigbtn" style={{ maxWidth: '160px' }}>Copy</button>
          <button onClick={handleShare} className="bigbtn dark" style={{ maxWidth: '160px' }}>Share</button>
        </div>
      </div>
    </section>
  );
};

export default LogsPanel;