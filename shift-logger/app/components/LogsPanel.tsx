import React, { useState, useEffect, useRef } from 'react';
import type { Shift, Entry } from '@/types';

interface LogsPanelProps {
  activeShift: Shift | null;
  onDeleteEntry: (index: number) => void;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ activeShift, onDeleteEntry }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const completedEntries = activeShift?.entries.filter(e => !e.inProgress) || [];

  // Re-implement the log text generation for copy/share
  const generateFullLogText = () => {
    if (!activeShift) return 'No shift loaded.';
    const header = `Date: ${activeShift.date}\nShift: ${activeShift.timings}\nDesignation: ${activeShift.designation}\n\n`;
    const body = completedEntries.map(e => e.text).join('\n');
    return header + body;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateFullLogText());
    alert('Log copied to clipboard!');
  };

  const handleShare = () => {
    const fullLogText = generateFullLogText();
    if (navigator.share) {
      navigator.share({ title: 'Shift Log', text: fullLogText });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(fullLogText);
      alert('Share not supported, log copied to clipboard instead.');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, index: number) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, index });
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    longPressTimeout.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ x: touch.pageX, y: touch.pageY, index });
    }, 500); // 500ms for a long press
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleDelete = () => {
    if (contextMenu) {
      onDeleteEntry(contextMenu.index);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <section className="card section">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Completed Shift Log</h2>
          <span className="muted">Right-click or long-press an entry to delete</span>
      </div>
      
      <div className="log-list-container">
        {completedEntries.length > 0 ? (
          completedEntries.map((entry, index) => (
            <div
              key={index}
              className="log-item"
              onContextMenu={(e) => handleContextMenu(e, index)}
              onTouchStart={(e) => handleTouchStart(e, index)}
              onTouchEnd={handleTouchEnd}
            >
              {entry.text}
            </div>
          ))
        ) : (
          <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No completed entries for this shift.</p>
        )}
      </div>

      {/* FIX: The toolbar with Copy and Share buttons has been re-added */}
      <div className="toolbar" style={{ marginTop: '10px', justifyContent: 'flex-start' }}>
        <button onClick={handleCopy} className="bigbtn" style={{ maxWidth: '160px' }}>Copy</button>
        <button onClick={handleShare} className="bigbtn dark" style={{ maxWidth: '160px' }}>Share</button>
      </div>

      {contextMenu && (
        <div
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button onClick={handleDelete}>Delete Entry</button>
        </div>
      )}
    </section>
  );
};

export default LogsPanel;
