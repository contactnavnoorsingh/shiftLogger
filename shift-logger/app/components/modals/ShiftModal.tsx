import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { Shift } from '@/types';
import { todayISO } from '@/lib/utils';

interface ShiftModalProps {
  onClose: () => void;
  onShiftLoaded: (shift: Shift) => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ onClose, onShiftLoaded }) => {
  const [date, setDate] = useState(todayISO());
  const [timings, setTimings] = useState('');
  const [designation, setDesignation] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreate = async () => {
    if (!timings || !designation) {
      alert('Please fill in all fields.');
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.post<{ shift: Shift }>('/shifts', { date, timings, designation });
      onShiftLoaded(data.shift);
    } catch (error) {
      alert('Failed to create shift.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = async () => {
    setIsLoading(true);
    try {
        const { data } = await api.get<{ shift: Shift | null }>(`/shifts/${date}`);
        if(data.shift) {
            onShiftLoaded(data.shift);
        } else {
            alert('No shift found for that date.');
        }
    } catch (error) {
        alert('Failed to load shift.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="backdrop show">
      <div className="modal">
        <h3>Shift Setup</h3>
        <div className="step">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            <input placeholder="Shift timings (e.g., 18:00–06:00)" value={timings} onChange={(e) => setTimings(e.target.value)} />
            <input placeholder="Designation (e.g., Security Guard)" value={designation} onChange={(e) => setDesignation(e.target.value)} />
        </div>
        <button onClick={handleCreate} className="bigbtn" disabled={isLoading}>
          {isLoading ? 'Working...' : 'Create / Overwrite'}
        </button>
        <button onClick={handleLoad} className="bigbtn dark" disabled={isLoading}>
          {isLoading ? 'Working...' : 'Load Existing'}
        </button>
        <button onClick={onClose} className="bigbtn ghost" disabled={isLoading}>Cancel</button>
      </div>
    </div>
  );
};

export default ShiftModal;