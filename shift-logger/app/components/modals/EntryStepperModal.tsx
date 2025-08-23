import React, { useState } from 'react';
import type { Entry } from '@/types';
import { now24 } from '@/lib/utils';
import { api } from '@/lib/api';

interface EntryStepperModalProps {
  shiftDate: string;
  onClose: () => void;
  onEntryCreated: (entry: Entry) => void;
}

const EntryStepperModal: React.FC<EntryStepperModalProps> = ({ onClose, onEntryCreated }) => {
    const [step, setStep] = useState(0);
    const [status, setStatus] = useState<'10-7' | '10-8'>('10-8');
    const [site, setSite] = useState('');
    const [isOk, setIsOk] = useState(true);
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!site) return alert('Site is required.');
        
        let finalText = `${now24()} ${status} at ${site} — Patrolled exterior and interior. All secure.`;
        
        if (!isOk) {
            if (!notes) return alert('Notes are required if site is not OK.');
            setIsLoading(true);
            try {
                const { data } = await api.post<{ text: string }>('/ai/polish', { note: notes });
                finalText = `${now24()} ${status} at ${site} — ${data.text}`;
            } catch (error) {
                finalText = `${now24()} ${status} at ${site} — ${notes}`; // Fallback to raw notes
            } finally {
                setIsLoading(false);
            }
        }

        const newEntry: Entry = {
            time: now24(),
            status,
            site,
            ok: isOk,
            text: finalText,
            tenFour: false,
            manual: false,
        };
        onEntryCreated(newEntry);
        onClose();
    };
    
    const renderStep = () => {
        switch(step) {
            case 0:
                return (
                    <>
                        <h3>New Entry: Status</h3>
                        <button className="bigbtn" onClick={() => { setStatus('10-7'); setStep(1); }}>10-7 (Out of service)</button>
                        <button className="bigbtn" onClick={() => { setStatus('10-8'); setStep(1); }}>10-8 (In service)</button>
                    </>
                );
            case 1:
                return (
                     <>
                        <h3>Site / Location</h3>
                        <input placeholder="Enter site name or address..." value={site} onChange={e => setSite(e.target.value)} />
                        <button className="bigbtn" onClick={() => setStep(2)} disabled={!site}>Next</button>
                    </>
                );
            case 2:
                return (
                    <>
                        <h3>Is everything OK?</h3>
                        <button className="bigbtn" onClick={() => { setIsOk(true); handleSubmit(); }}>Yes, All OK</button>
                        <button className="bigbtn dark" onClick={() => { setIsOk(false); setStep(3); }}>No, Issue Noted</button>
                    </>
                );
            case 3:
                return (
                    <>
                        <h3>Describe Issue</h3>
                        <textarea placeholder="Describe issue or observation... AI will polish this." value={notes} onChange={e => setNotes(e.target.value)} />
                        <button className="bigbtn" onClick={handleSubmit} disabled={isLoading || !notes}>
                            {isLoading ? 'Polishing...' : 'Finalize & Save'}
                        </button>
                    </>
                );
            default:
                return null;
        }
    }

    return (
        <div className="backdrop show">
            <div className="modal">
                <div className="step">
                    {renderStep()}
                </div>
                <button className="bigbtn ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
            </div>
        </div>
    );
};

export default EntryStepperModal;