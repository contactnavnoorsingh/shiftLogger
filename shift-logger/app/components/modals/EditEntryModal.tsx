import React, { useState } from 'react';
import type { Entry } from '@/types';
import { api } from '@/lib/api';

interface EditEntryModalProps {
  entry: Entry;
  onClose: () => void;
  onSave: (newText: string, newTime: string) => void;
}

const EditEntryModal: React.FC<EditEntryModalProps> = ({ entry, onClose, onSave }) => {
    const [editedTime, setEditedTime] = useState(entry.time);
    const [editedText, setEditedText] = useState(entry.text.substring(6)); // Remove time and status
    const [manualNotes, setManualNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = () => {
        let final_text = `${editedTime} ${entry.status} ${editedText}`;
        if(manualNotes) {
            final_text += `\n${manualNotes}`;
        }
        onSave(final_text, editedTime);
        onClose();
    };
    
    const handlePolish = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.post<{ text: string }>('/ai/polish', { note: editedText });
            setEditedText(data.text);
        } catch (error) {
            alert('Failed to polish text.');
        } finally {
            setIsLoading(false);
        }
    };

    // FIX: New handler for the "10-4" button
    const handleAddTenFour = () => {
        if (!editedText.includes('10-4')) {
            setEditedText(prev => `${prev.trim()} Everything is 10-4.`);
        }
    };

    return (
        <div className="backdrop show">
            <div className="modal">
                <h3>Edit Log Entry</h3>
                <label className="muted">Time</label>
                <input type="time" value={editedTime} onChange={e => setEditedTime(e.target.value)} />
                <label className="muted">Log Entry Text</label>
                <textarea 
                    value={editedText} 
                    onChange={e => setEditedText(e.target.value)}
                    style={{ minHeight: '150px' }}
                />
                <label className="muted">Add Manual Notes (Optional)</label>
                <textarea 
                    placeholder="Add any additional details here..."
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    style={{ minHeight: '80px' }}
                />
                <div className="toolbar" style={{flexWrap: 'nowrap'}}>
                    <button onClick={handlePolish} className="bigbtn dark" disabled={isLoading}>
                        {isLoading ? 'Polishing...' : 'Polish'}
                    </button>
                    {/* FIX: Added the new "Everything is 10-4" button */}
                    <button onClick={handleAddTenFour} className="bigbtn dark">
                        10-4
                    </button>
                    <button onClick={handleSave} className="bigbtn">Save</button>
                </div>
                <button onClick={onClose} className="bigbtn ghost">Cancel</button>
            </div>
        </div>
    );
};

export default EditEntryModal;
