import React, { useState } from 'react';
import type { Entry } from '@/types';
import { now24 } from '@/lib/utils';
import { api } from '@/lib/api';

interface ManualEntryModalProps {
  onClose: () => void;
  onEntryCreated: (entry: Entry) => void;
}

const ManualEntryModal: React.FC<ManualEntryModalProps> = ({ onClose, onEntryCreated }) => {
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!notes) {
            alert('Manual entry cannot be empty.');
            return;
        }
        
        setIsLoading(true);
        let polishedText = '';
        try {
            // Use the AI polishing endpoint for consistency
            const { data } = await api.post<{ text: string }>('/ai/polish', { note: notes });
            polishedText = data.text;
        } catch (error) {
            // Fallback to raw notes if AI fails
            polishedText = notes; 
        } finally {
            setIsLoading(false);
        }

        const newEntry: Entry = {
            time: now24(),
            status: '10-8', // Default status for manual entries
            site: 'Manual Entry',
            text: `${now24()} ${polishedText}`,
            ok: true,
            tenFour: false,
            manual: true,
            inProgress: false, // Manual entries are always complete
            entryType: 'MANUAL',
        };
        
        onEntryCreated(newEntry);
        onClose();
    };

    return (
        <div className="backdrop show">
            <div className="modal">
                <h3>Manual Log Entry</h3>
                <textarea 
                    placeholder="Describe the event or observation..." 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    autoFocus 
                    style={{ minHeight: '150px' }}
                />
                <button className="bigbtn" onClick={handleSubmit} disabled={isLoading || !notes}>
                    {isLoading ? 'Polishing...' : 'Save Manual Entry'}
                </button>
                <button className="bigbtn ghost" onClick={onClose} disabled={isLoading}>
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default ManualEntryModal;
