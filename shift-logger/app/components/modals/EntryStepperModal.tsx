import React, { useState, Fragment, useEffect } from 'react';
import type { Entry, Shift } from '@/types';
import { now24 } from '@/lib/utils';
import { api } from '@/lib/api';
import { tplLocations } from '@/lib/tplLocations';
import SearchableInput from '../SearchableInput';


interface EntryStepperModalProps {
  shift: Shift;
  onClose: () => void;
  onEntryCreated: (entry: Entry) => void;
  onEntryUpdated: (entry: Entry, index: number) => void;
  inProgressEntry?: Entry | null;
  inProgressEntryIndex?: number | null;
}

const guardCheckItems = [
    { question: "Is the guard in full, proper uniform?", label: "Uniform" },
    { question: "Is the guard's memorable book up to date?", label: "Log Book" },
    { question: "Is the guard updating memos on the online dashboard as well?", label: "Dashboard Memos" },
    { question: "Is the guard's security license, CPR, and Use of Force license present and valid?", label: "Licenses" },
];

const interchangeLocations = [
    "Bramalea Rd Unit H-5, Brampton",
    "Atrium on Bay, 20 Dundas Street West, Toronto",
    "5617 Yonge St, Toronto",
    "3621 Hwy 7 #101, Markham"
];

const EntryStepperModal: React.FC<EntryStepperModalProps> = ({ shift, onClose, onEntryCreated, onEntryUpdated, inProgressEntry, inProgressEntryIndex }) => {
    const isUpdating = inProgressEntry && inProgressEntryIndex != null;

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
    
    // GTA Mode State
    const [isInterchange, setIsInterchange] = useState<boolean|null>(null);
    const [isAlarm, setIsAlarm] = useState<boolean|null>(null);
    const [alarmCompany, setAlarmCompany] = useState('');

    useEffect(() => {
        if (isUpdating && inProgressEntry) {
            setStatus(inProgressEntry.status);
            setSite(inProgressEntry.site);
            switch (inProgressEntry.entryType) {
                case 'TPL': 
                    setStep(3); // Start of TPL continuation flow
                    break;
                case 'INTERCHANGE': 
                    setStep(11);
                    break;
                case 'ALARM': 
                    setStep(12);
                    break;
            }
        }
    }, [isUpdating, inProgressEntry]);

    const handleInitialSubmit = (entryType: 'TPL' | 'INTERCHANGE' | 'ALARM', initialText: string, details?: object) => {
        const newEntry: Entry = {
            time: now24(),
            status,
            site,
            text: initialText,
            ok: true,
            tenFour: false,
            manual: false,
            inProgress: true,
            entryType,
            details,
        };
        onEntryCreated(newEntry);
        onClose();
    };

    const handleFinalSubmit = async () => {
        if (!isUpdating || !inProgressEntry || inProgressEntryIndex == null) return;

        const timeAndStatusPrefix = `${inProgressEntry.time} ${inProgressEntry.status}`;
        
        let descriptiveText = `at ${inProgressEntry.site}.`;
        
        if (inProgressEntry.entryType === 'TPL') {
            if (guardPresent) {
                const checkResults = guardCheckItems.map((item, index) => `${item.label}: ${guardChecks[index] ? 'Yes' : 'No'}`).join(', ');
                descriptiveText += ` Visited guard ${guardName || 'N/A'}. Checks - ${checkResults}.`;
            } else {
                descriptiveText += ` No guard present. Site secure.`;
            }
        } else if (inProgressEntry.entryType === 'INTERCHANGE') {
            descriptiveText += ` Interchange assistance for staff.`;
        } else if (inProgressEntry.entryType === 'ALARM') {
            descriptiveText += ` Alarm response for ${alarmCompany || (inProgressEntry.details as any)?.company}.`;
        }

        setIsLoading(true);
        let polishedNote = '';
        try {
            const noteToPolish = !isOk ? `Further issue noted: ${notes}` : "All secure.";
            const fullNoteToPolish = `${descriptiveText} ${noteToPolish}`;
            const { data } = await api.post<{ text: string }>('/ai/polish', { note: fullNoteToPolish });
            polishedNote = data.text;
        } catch (error) {
            polishedNote = !isOk ? `${descriptiveText} Further issue noted: ${notes}` : `${descriptiveText} All secure.`;
        } finally {
            setIsLoading(false);
        }

        const finalLogText = `${timeAndStatusPrefix} ${polishedNote}`;

        const updatedEntry: Entry = {
            ...inProgressEntry,
            staffName,
            guardName: guardPresent ? guardName : '',
            guardChecks: guardPresent ? guardChecks : [],
            ok: isOk,
            text: finalLogText.replace(/\s+/g, ' ').trim(),
            inProgress: false,
        };
        
        onEntryUpdated(updatedEntry, inProgressEntryIndex);
        onClose();
    };

    const handleGuardCheckAnswer = (answer: boolean) => {
        const newChecks = [...guardChecks];
        newChecks[guardQuestionIndex] = answer;
        setGuardChecks(newChecks);
        if (guardQuestionIndex < guardCheckItems.length - 1) {
            setGuardQuestionIndex(prev => prev + 1);
        } else {
            setStep(6);
        }
    };

    const renderTPLContinuationFlow = () => {
        switch(step) {
            case 3:
                return (
                    <>
                        <h3>Is a guard present at {site}?</h3>
                        <button className="bigbtn" onClick={() => { setGuardPresent(true); setStep(4); }}>Yes</button>
                        <button className="bigbtn dark" onClick={() => { setGuardPresent(false); setStep(6); }}>No</button>
                    </>
                );
            case 4:
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
            case 5:
                return (
                     <Fragment>
                        <h3>Guard Check ({guardQuestionIndex + 1}/{guardCheckItems.length})</h3>
                        <p style={{ textAlign: 'center', fontSize: '1.2rem', minHeight: '60px', padding: '10px 0' }}>{guardCheckItems[guardQuestionIndex].question}</p>
                        <button className="bigbtn" onClick={() => handleGuardCheckAnswer(true)}>Yes</button>
                        <button className="bigbtn dark" onClick={() => handleGuardCheckAnswer(false)}>No</button>
                    </Fragment>
                );
            case 6:
                return (
                    <>
                        <h3>Is everything else OK?</h3>
                        <button className="bigbtn" onClick={() => { setIsOk(true); handleFinalSubmit(); }}>Yes, All OK</button>
                        <button className="bigbtn dark" onClick={() => { setIsOk(false); setStep(7); }}>No, Issue Noted</button>
                    </>
                );
            case 7:
                return (
                    <>
                        <h3>Describe Issue</h3>
                        <textarea placeholder="Describe issue or observation... AI will polish this." value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
                        <button className="bigbtn" onClick={handleFinalSubmit} disabled={isLoading || !notes}>
                            {isLoading ? 'Polishing...' : 'Finalize & Save'}
                        </button>
                    </>
                );
            default: return null;
        }
    };

    const renderGTAFlow = () => {
         switch(step) {
            case 2: // Start of GTA Flow
                return (
                    <>
                        <h3>Interchange?</h3>
                        <button className="bigbtn" onClick={() => { setIsInterchange(true); setStep(8); }}>Yes</button>
                        <button className="bigbtn dark" onClick={() => { setIsInterchange(false); setStep(9); }}>No</button>
                    </>
                );
            case 8: // Interchange Location
                return (
                    <>
                        <h3>Select Interchange Location</h3>
                        <select value={site} onChange={e => setSite(e.target.value)}>
                            <option value="" disabled>Select Location...</option>
                            {interchangeLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                        </select>
                        <button className="bigbtn" disabled={!site} onClick={() => handleInitialSubmit('INTERCHANGE', `${now24()} ${status} at Interchange: ${site}. Awaiting staff.`, { location: site })}>Confirm Arrival & Go Standby</button>
                    </>
                );
            case 9: // Alarm?
                return (
                    <>
                        <h3>Alarm Response?</h3>
                        <button className="bigbtn" onClick={() => { setIsAlarm(true); setStep(10); }}>Yes</button>
                        <button className="bigbtn dark" onClick={() => setStep(101)}>No (Visit TPL Site)</button>
                    </>
                );
            case 10: // Alarm Details
                return (
                    <>
                        <h3>Alarm Details</h3>
                        <input placeholder="Alarm Company (e.g., Telus, Bell)..." value={alarmCompany} onChange={e => setAlarmCompany(e.target.value)} autoFocus />
                        <input placeholder="Site Location / Address..." value={site} onChange={e => setSite(e.target.value)} />
                        <button className="bigbtn" disabled={!alarmCompany || !site} onClick={() => handleInitialSubmit('ALARM', `${now24()} ${status} at ${site} for ${alarmCompany} alarm.`, { company: alarmCompany, location: site })}>Confirm Arrival & Go Standby</button>
                    </>
                );
            case 11: // Complete Interchange
            case 12: // Complete Alarm
                return (
                    <>
                        <h3>Site Check Complete?</h3>
                        <p>Finalize the log for {inProgressEntry?.site}.</p>
                        <button className="bigbtn" onClick={() => { setIsOk(true); handleFinalSubmit(); }}>Yes, All Secure</button>
                        <button className="bigbtn dark" onClick={() => { setIsOk(false); setStep(7); }}>No, Issue Noted</button>
                    </>
                );
            case 7: // Describe Issue (re-used for all flows)
                return (
                    <>
                        <h3>Describe Issue</h3>
                        <textarea placeholder="Describe issue or observation... AI will polish this." value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
                        <button className="bigbtn" onClick={handleFinalSubmit} disabled={isLoading || !notes}>
                            {isLoading ? 'Polishing...' : 'Finalize & Save'}
                        </button>
                    </>
                );
            default: return null;
        }
    };
    
    const renderStep = () => {
        const effectiveMode = shift.mode || (shift.designation.startsWith('GTA') ? 'GTA' : 'TPL');

        if (isUpdating) {
            if (inProgressEntry?.entryType === 'TPL') return renderTPLContinuationFlow();
            return renderGTAFlow();
        }

        switch(step) {
            case 0: // Status
                return (
                    <>
                        <h3>New Entry: Status</h3>
                        <button className="bigbtn" onClick={() => { setStatus('10-7'); setStep(1); }}>10-7 (Out of service)</button>
                        <button className="bigbtn" onClick={() => { setStatus('10-8'); setStep(1); }}>10-8 (In service)</button>
                    </>
                );
            case 1: // Initial routing based on shift mode
                if (effectiveMode === 'GTA') {
                    setStep(2); // Immediately jump to the GTA flow
                    return null;
                }
                // Default to TPL flow
                return (
                     <>
                        <h3>TPL Site / Location</h3>
                        <SearchableInput
                            placeholder="Enter TPL site name..."
                            value={site}
                            onChange={setSite}
                            data={tplLocations}
                        />
                        <button 
                            className="bigbtn" 
                            onClick={() => handleInitialSubmit('TPL', `${now24()} ${status} at ${site}. Arrived on site.`)} 
                            disabled={!site}
                        >
                            Confirm Arrival & Go Standby
                        </button>
                    </>
                );
            case 101: // Fallback from GTA to TPL flow
                return (
                     <>
                        <h3>TPL Site / Location</h3>
                         <SearchableInput
                            placeholder="Enter TPL site name..."
                            value={site}
                            onChange={setSite}
                            data={tplLocations}
                        />
                        <button 
                            className="bigbtn" 
                            onClick={() => handleInitialSubmit('TPL', `${now24()} ${status} at ${site}. Arrived on site.`)} 
                            disabled={!site}
                        >
                            Confirm Arrival & Go Standby
                        </button>
                    </>
                );
            default:
                if (effectiveMode === 'GTA') {
                    return renderGTAFlow();
                }
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
