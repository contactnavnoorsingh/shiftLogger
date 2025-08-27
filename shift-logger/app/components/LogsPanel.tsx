import React, { useState, useEffect, useRef } from 'react';
import type { Shift, Entry } from '@/types';
import { copyToClipboard } from '@/lib/utils';

interface LogsPanelProps {
  activeShift: Shift | null;
  onDeleteEntry: (index: number) => void;
  onEditEntry: (entry: Entry, index: number) => void;
  userFullName: string | null;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ activeShift, onDeleteEntry, onEditEntry, userFullName }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; originalIndex: number; entry: Entry } | null>(null);
  const longPressTimeout = useRef<NodeJS.Timeout>();

  const completedEntries = activeShift?.entries
    .map((entry, index) => ({ ...entry, originalIndex: index })) // Attach original index before filtering/sorting
    .filter(e => !e.inProgress)
    .sort((a, b) => a.time.localeCompare(b.time)) || [];

  const generateFullLogText = () => {
    if (!activeShift) return 'No shift loaded.';
    const header = `Guard: ${userFullName || 'N/A'}\nDate: ${activeShift.date}\nShift: ${activeShift.timings}\nDesignation: ${activeShift.designation}\n\n---\n\n`;
    const body = completedEntries.map(e => e.text).join('\n');
    return header + body;
  };

  const handleCopy = () => copyToClipboard(generateFullLogText());
  const handleShare = () => {
    const text = generateFullLogText();
    if (navigator.share) {
      navigator.share({ title: 'Shift Log', text });
    } else {
      copyToClipboard(text);
    }
  };

  // FIX: The handlers now receive the original, stable index of the entry.
  const handleContextMenu = (e: React.MouseEvent, originalIndex: number, entry: Entry) => {
    e.preventDefault();
    setContextMenu({ x: e.pageX, y: e.pageY, originalIndex, entry });
  };

  const handleTouchStart = (e: React.TouchEvent, originalIndex: number, entry: Entry) => {
    longPressTimeout.current = setTimeout(() => {
      const touch = e.touches[0];
      setContextMenu({ x: touch.pageX, y: touch.pageY, originalIndex, entry });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimeout.current) clearTimeout(longPressTimeout.current);
  };

  const handleDelete = () => {
    if (contextMenu) {
      onDeleteEntry(contextMenu.originalIndex);
      setContextMenu(null);
    }
  };

  const handleEdit = () => {
    if (contextMenu) {
      onEditEntry(contextMenu.entry, contextMenu.originalIndex);
      setContextMenu(null);
    }
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <section className="card section">
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>Completed Shift Log</h2>
          {activeShift?.status === 'Active' && <span className="muted">Right-click or long-press an entry to edit/delete</span>}
      </div>
      
      <div className="log-list-container">
        {completedEntries.length > 0 ? (
          completedEntries.map((entry) => (
            <div
              key={entry.originalIndex} // Use originalIndex as a stable key
              className="log-item"
              onContextMenu={(e) => activeShift?.status === 'Active' && handleContextMenu(e, entry.originalIndex, entry)}
              onTouchStart={(e) => activeShift?.status === 'Active' && handleTouchStart(e, entry.originalIndex, entry)}
              onTouchEnd={handleTouchEnd}
            >
              {entry.text}
            </div>
          ))
        ) : (
          <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No completed entries for this shift.</p>
        )}
      </div>

      <div className="toolbar" style={{ marginTop: '10px', justifyContent: 'flex-start' }}>
        <button onClick={handleCopy} className="bigbtn" style={{ maxWidth: '160px' }}>Copy</button>
        <button onClick={handleShare} className="bigbtn dark" style={{ maxWidth: '160px' }}>Share</button>
      </div>

      {contextMenu && (
        <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={handleEdit}>Edit Entry</button>
          <button onClick={handleDelete}>Delete Entry</button>
        </div>
      )}
    </section>
  );
};

export default LogsPanel;
