import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Shift } from '@/types';
import { format, parseISO } from 'date-fns';

interface ShiftModalProps {
  onClose: () => void;
  onShiftLoaded: (shift: Shift) => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ onClose, onShiftLoaded }) => {
  const [activeTab, setActiveTab] = useState<'create' | 'load'>('create');
  const [designation, setDesignation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [pastShifts, setPastShifts] = useState<Shift[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'load') {
      const fetchPastShifts = async () => {
        setIsLoading(true);
        try {
          const { data } = await api.get<{ shifts: Shift[] }>('/shifts');
          setPastShifts(data.shifts);
        } catch (error) {
          alert('Failed to load past shifts.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchPastShifts();
    }
  }, [activeTab]);

  const handleCreate = async () => {
    if (!designation || !startTime || !endTime) {
      alert('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post<{ shift: Shift }>('/shifts', {
        designation,
        startTime,
        endTime,
      });
      onShiftLoaded(data.shift);
    } catch (error) {
      alert('Failed to create shift.');
    } finally {
      setIsLoading(false);
    }
  };

  const isShiftCompleted = (shift: Shift) => new Date() > new Date(shift.endTime);

  return (
    <div className="backdrop show">
      <div className="modal">
        <div className="row" style={{ borderBottom: '1px solid var(--line)', marginBottom: '14px' }}>
          <button
            className={`bigbtn ${activeTab === 'create' ? '' : 'ghost'}`}
            onClick={() => setActiveTab('create')}
            style={{ margin: '0 0 -1px 0', borderRadius: '12px 12px 0 0' }}
          >
            Create New
          </button>
          <button
            className={`bigbtn ${activeTab === 'load' ? '' : 'ghost'}`}
            onClick={() => setActiveTab('load')}
            style={{ margin: '0 0 -1px 0', borderRadius: '12px 12px 0 0' }}
          >
            Load Existing
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="step">
            <h3>New Shift Setup</h3>
            <input
              placeholder="Designation (e.g., Security Guard)"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
            />
            <label className="muted">Start Time</label>
            <input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <label className="muted">End Time</label>
            <input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <button onClick={handleCreate} className="bigbtn" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Shift'}
            </button>
          </div>
        )}

        {activeTab === 'load' && (
          <div>
            <h3>Load Existing Shift</h3>
            {isLoading && <p>Loading shifts...</p>}
            <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
              {pastShifts.map((shift) => (
                <div key={shift._id} className="card" onClick={() => onShiftLoaded(shift)} style={{ marginBottom: '10px', cursor: 'pointer', padding: '12px' }}>
                  <div className="row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <strong>{format(parseISO(shift.date), 'MMMM do, yyyy')}</strong>
                      <p className="muted" style={{ margin: '4px 0 0 0' }}>{shift.timings} - {shift.designation}</p>
                    </div>
                    <span className={`chip ${isShiftCompleted(shift) ? 'dark' : 'green'}`}>
                      {isShiftCompleted(shift) ? 'Completed' : 'Active'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <button onClick={onClose} className="bigbtn ghost" disabled={isLoading}>Cancel</button>
      </div>
    </div>
  );
};

export default ShiftModal;