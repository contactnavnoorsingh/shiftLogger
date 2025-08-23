import React, { useState } from 'react';
import { api } from '@/lib/api';
import type { Entry, Shift } from '@/types';

interface Floating10FourCardProps {
  entry: Entry;
  entryIndex: number;
  shiftId: string; // Changed from shiftDate
  onDismiss: () => void;
  onUpdate: (updatedShift: Shift) => void;
}

const Floating10FourCard: React.FC<Floating10FourCardProps> = ({ entry, entryIndex, shiftId, onDismiss, onUpdate }) => {
    const [isLoading, setIsLoading] = useState(false);

    const handleTenFour = async (isConfirmed: boolean) => {
        setIsLoading(true);
        try {
            // Use shiftId in the API call
            const { data } = await api.post<{ shift: Shift }>(
                `/shifts/${shiftId}/entries/${entryIndex}/tenfour`,
                { tenFour: isConfirmed }
            );
            onUpdate(data.shift);
        } catch (error) {
            alert('Failed to update entry. Will sync later.');
        } finally {
            setIsLoading(false);
            onDismiss();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '14px',
            left: '14px',
            right: '14px',
            zIndex: 500,
        }}>
            <div className="card section">
                <p style={{ margin: '0 0 10px 0' }}><strong>Last Entry:</strong> {entry.text}</p>
                <div className="row">
                    <div style={{ flex: 1 }}>
                        <button className="bigbtn" onClick={() => handleTenFour(true)} disabled={isLoading}>
                            Everything’s 10-4
                        </button>
                    </div>
                    <div style={{ flex: 1 }}>
                        <button className="bigbtn ghost" onClick={() => onDismiss()} disabled={isLoading}>
                            Skip
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Floating10FourCard;