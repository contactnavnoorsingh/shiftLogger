import React, { useState, Fragment } from 'react';
import type { Entry } from '@/types';
import { now24 } from '@/lib/utils';
import { api } from '@/lib/api';

interface EntryStepperModalProps {
  shiftDate: string;
  onClose: () => void;
  onEntryCreated: (entry: Entry) => void;
}

// Updated guard check questions and short labels for the log text
const guardCheckItems = [
    { question: "Is the guard in full, proper uniform?", label: "Uniform" },
    { question: "Is the guard's memorable book up to date?", label: "Log Book" },
    { question: "Is the guard updating memos on the online dashboard as well?", label: "Dashboard Memos" },
    { question: "Is the guard's security license, CPR, and Use of Force license present and valid?", label: "Licenses" },
];

const EntryStepperModal: React.FC<EntryStepperModalProps> = ({ onClose, onEntryCreated }) => {
    // --- State ---
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [guardQuestionIndex, setGuardQuestionIndex] = useState(0);

    // Entry Data State
    const [status, setStatus] = useState<'10-7' | '10-8'>('10-8');
    const [site, setSite] = useState('');
    const [staffName, setStaffName] = useState('');
    const [guardPresent, setGuardPresent] = useState<boolean | null>(null);
    const [guardName, setGuardName] = useState('');
    const [guardChecks, setGuardChecks] = useState<boolean[]>(new Array(guardCheckItems.length).fill(true));
    const [isOk, setIsOk] = useState(true);
    const [notes, setNotes] = useState('');

    // --- Handlers ---
    const handleGuardCheckAnswer = (answer: boolean) => {
        const newChecks = [...guardChecks];
        newChecks[guardQuestionIndex] = answer;
        setGuardChecks(newChecks);

        if (guardQuestionIndex < guardCheckItems.length - 1) {
            setGuardQuestionIndex(prev => prev + 1);
        } else {
            setStep(6); // All questions answered, move to the next main step
        }
    };

    const handleSubmit = async () => {
        if (!site) return alert('Site is required.');

        let baseText = `${now24()} ${status} at ${site}.`;

        if (guardPresent) {
            const checkResults = guardCheckItems.map((item, index) => 
                `${item.label}: ${guardChecks[index] ? 'Yes' : 'No'}`
            ).join(', ');
            baseText += ` Visited guard ${guardName || 'N/A'}. Checks - ${checkResults}.`;
        }

        let finalText = '';

        if (!isOk) {
            if (!notes) return alert('Notes are required if there is an issue.');
            setIsLoading(true);
            try {
                const { data } = await api.post<{ text: string }>('/ai/polish', { note: notes });
                finalText = `${baseText} Further issue noted: ${data.text}`;
            } catch (error) {
                finalText = `${baseText} Further issue noted: ${notes}`;
            } finally {
                setIsLoading(false);
            }
        } else {
             finalText = `${baseText} All secure.`;
        }

        const newEntry: Entry = {
            time: now24(),
            status,
            site,
            staffName,
            guardName: guardPresent ? guardName : '',
            guardChecks: guardPresent ? guardChecks : [],
            ok: isOk,
            text: finalText.replace(/\.\s*/g, '. ').trim(),
            tenFour: false,
            manual: false,
        };
        onEntryCreated(newEntry);
        onClose();
    };

    // --- Render Logic ---
    const renderGuardQuestionStep = () => {
        const currentItem = guardCheckItems[guardQuestionIndex];
        return (
             <Fragment>
                <h3>Guard Check ({guardQuestionIndex + 1}/{guardCheckItems.length})</h3>
                <p style={{ textAlign: 'center', fontSize: '1.2rem', minHeight: '60px', padding: '10px 0' }}>
                    {currentItem.question}
                </p>
                <button className="bigbtn" onClick={() => handleGuardCheckAnswer(true)}>Yes</button>
                <button className="bigbtn dark" onClick={() => handleGuardCheckAnswer(false)}>No</button>
            </Fragment>
        );
    };
    
    const renderStep = () => {
        switch(step) {
            case 0: // Status
                return (
                    <>
                        <h3>New Entry: Status</h3>
                        <button className="bigbtn" onClick={() => { setStatus('10-7'); setStep(1); }}>10-7 (Out of service)</button>
                        <button className="bigbtn" onClick={() => { setStatus('10-8'); setStep(1); }}>10-8 (In service)</button>
                    </>
                );
            case 1: // Site
                return (
                     <>
                        <h3>Site / Location</h3>
                        <input placeholder="Enter site name or address..." value={site} onChange={e => setSite(e.target.value)} autoFocus />
                        <button className="bigbtn" onClick={() => setStep(2)} disabled={!site}>Next</button>
                    </>
                );
            case 2: // Staff Name (Optional)
                return (
                    <>
                        <h3>Staff Name (Optional)</h3>
                        <input placeholder="Enter staff name if applicable..." value={staffName} onChange={e => setStaffName(e.target.value)} autoFocus />
                        <button className="bigbtn" onClick={() => setStep(3)}>Next</button>
                    </>
                );
            case 3: // Guard Present?
                return (
                    <>
                        <h3>Is a guard present?</h3>
                        <button className="bigbtn" onClick={() => { setGuardPresent(true); setStep(4); }}>Yes</button>
                        <button className="bigbtn dark" onClick={() => { setGuardPresent(false); setStep(6); }}>No</button>
                    </>
                );
            case 4: // Guard Name
                return (
                    <>
                        <h3>Guard Name</h3>
                        <input placeholder="Enter guard's name..." value={guardName} onChange={e => setGuardName(e.target.value)} autoFocus />
                        <div className="row">
                            <button className="bigbtn" onClick={() => setStep(5)} disabled={!guardName} style={{ flex: 1 }}>Enter</button>
                            <button className="bigbtn dark" onClick={() => setStep(5)} style={{ flex: 1 }}>Skip</button>
                        </div>
                    </>
                );
            case 5: // Guard Checks (Sequential)
                return renderGuardQuestionStep();
            case 6: // Is everything OK?
                return (
                    <>
                        <h3>Is everything else OK?</h3>
                        <button className="bigbtn" onClick={() => { setIsOk(true); handleSubmit(); }}>Yes, All OK</button>
                        <button className="bigbtn dark" onClick={() => { setIsOk(false); setStep(7); }}>No, Issue Noted</button>
                    </>
                );
            case 7: // Describe Issue
                return (
                    <>
                        <h3>Describe Issue</h3>
                        <textarea placeholder="Describe issue or observation... AI will polish this." value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
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