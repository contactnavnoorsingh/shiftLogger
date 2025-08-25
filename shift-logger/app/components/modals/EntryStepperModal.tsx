import React, { useState, Fragment, useEffect } from 'react';
import type { Entry, Shift, ShiftMode } from '@/types';
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

const parkingActions = ['Ticket Issued', 'Vehicle Towed', 'Warning Given', 'Observed'];

const EntryStepperModal: React.FC<EntryStepperModalProps> = ({ shift, onClose, onEntryCreated, onEntryUpdated, inProgressEntry, inProgressEntryIndex }) => {
    const isUpdating = inProgressEntry && inProgressEntryIndex != null;
    const [step, setStep] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    
    // Common State
    const [status, setStatus] = useState<'10-7' | '10-8'>('10-8');
    const [site, setSite] = useState('');
    const [isOk, setIsOk] = useState(true);
    const [notes, setNotes] = useState('');

    // TPL Patrol State
    const [guardPresent, setGuardPresent] = useState<boolean | null>(null);
    const [guardName, setGuardName] = useState('');
    const [guardChecks, setGuardChecks] = useState<boolean[]>(new Array(guardCheckItems.length).fill(true));
    const [guardQuestionIndex, setGuardQuestionIndex] = useState(0);

    // Alarm State
    const [alarmCompany, setAlarmCompany] = useState('');

    // Parking Enforcement State
    const [vehicleDetails, setVehicleDetails] = useState('');
    const [actionTaken, setActionTaken] = useState(parkingActions[0]);

    useEffect(() => {
        if (isUpdating && inProgressEntry) {
            setStatus(inProgressEntry.status);
            setSite(inProgressEntry.site);
            const continuationSteps = {
                TPL_PATROL: 100,
                TPL_ALARM: 200,
                TPL_PARKING: 300,
                GTA_INTERCHANGE: 400,
                GTA_ALARM: 200,
            };
            setStep(continuationSteps[inProgressEntry.entryType as keyof typeof continuationSteps] || 0);
        } else {
            setGuardPresent(null);
            setGuardName('');
            setGuardChecks(new Array(guardCheckItems.length).fill(true));
            setGuardQuestionIndex(0);
            setAlarmCompany('');
            setVehicleDetails('');
            setActionTaken(parkingActions[0]);
        }
    }, [isUpdating, inProgressEntry]);

    const handleInitialSubmit = (entryType: Entry['entryType'], initialText: string, details?: Entry['details']) => {
        const newEntry: Entry = {
            time: now24(), status, site, text: initialText, ok: true, tenFour: false, manual: false, inProgress: true, entryType, details,
        };
        onEntryCreated(newEntry);
        onClose();
    };

    const handleFinalSubmit = async () => {
        if (!isUpdating || !inProgressEntry || inProgressEntryIndex == null) return;
        setIsLoading(true);

        const timeAndStatusPrefix = `${inProgressEntry.time} ${inProgressEntry.status}`;
        let descriptiveText = `at ${inProgressEntry.site}.`;

        switch(inProgressEntry.entryType) {
            case 'TPL_PATROL':
                if (guardPresent) {
                    const checkResults = guardCheckItems.map((item, index) => `${item.label}: ${guardChecks[index] ? 'Yes' : 'No'}`).join(', ');
                    descriptiveText += ` Visited S/G "${guardName || 'N/A'}". Checks - ${checkResults}.`;
                } else {
                    descriptiveText += ` No guard present. Site secure.`;
                }
                break;
            case 'GTA_INTERCHANGE':
                descriptiveText += ` Interchange assistance for staff.`;
                break;
            case 'TPL_ALARM':
            case 'GTA_ALARM':
                descriptiveText += ` Alarm response for ${(inProgressEntry.details as any)?.company}.`;
                break;
            case 'TPL_PARKING':
                const currentVehicleDetails = vehicleDetails || (inProgressEntry.details as any)?.vehicleDetails;
                const currentActionTaken = actionTaken || (inProgressEntry.details as any)?.actionTaken;
                descriptiveText += ` Parking enforcement for vehicle ${currentVehicleDetails}. Action: ${currentActionTaken}.`;
                break;
        }

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
            guardName: guardPresent ? guardName : '', 
            guardChecks: guardPresent ? guardChecks : [], 
            ok: isOk, 
            text: finalLogText, 
            inProgress: false,
            entryType: inProgressEntry.entryType,
        };
        
        onEntryUpdated(updatedEntry, inProgressEntryIndex);
        onClose();
    };

    // --- RENDER FUNCTIONS FOR EACH WORKFLOW ---

    const renderSharedContinuation = () => (
        <>
            <h3>Site Check Complete?</h3>
            <p>Finalize the log for {inProgressEntry?.site}.</p>
            <button className="bigbtn" onClick={() => { setIsOk(true); handleFinalSubmit(); }} disabled={isLoading}>{isLoading ? 'Saving...' : 'Yes, All Secure'}</button>
            <button className="bigbtn dark" onClick={() => { setIsOk(false); setStep(999); }} disabled={isLoading}>No, Issue Noted</button>
        </>
    );
    
    const renderIssueStep = () => (
        <>
            <h3>Describe Issue</h3>
            <textarea placeholder="Describe issue or observation..." value={notes} onChange={e => setNotes(e.target.value)} autoFocus />
            <button className="bigbtn" onClick={handleFinalSubmit} disabled={isLoading || !notes}>{isLoading ? 'Polishing...' : 'Finalize & Save'}</button>
        </>
    );

    // --- RENDER FUNCTIONS FOR EACH INITIAL STEP ---
    const renderTPLPatrolForm = () => (
        <>
            <h3>TPL Site / Location</h3>
            <SearchableInput placeholder="Enter TPL site name..." value={site} onChange={setSite} data={tplLocations} />
            <button className="bigbtn" onClick={() => handleInitialSubmit('TPL_PATROL', `${now24()} ${status} at ${site}. Arrived on site.`)} disabled={!site}>Confirm Arrival & Go Standby</button>
        </>
    );

    const renderAlarmDetailsForm = () => (
        <>
            <h3>Alarm Details</h3>
            <input placeholder="Alarm Company (e.g., Telus, Bell)..." value={alarmCompany} onChange={e => setAlarmCompany(e.target.value)} autoFocus />
            <input placeholder="Site Location / Address..." value={site} onChange={e => setSite(e.target.value)} />
            <button className="bigbtn" disabled={!alarmCompany || !site} onClick={() => handleInitialSubmit(shift.mode === 'GTA_MOBILE' ? 'GTA_ALARM' : 'TPL_ALARM', `${now24()} ${status} at ${site} for ${alarmCompany} alarm.`, { company: alarmCompany, location: site })}>Confirm Arrival & Go Standby</button>
        </>
    );

    const renderParkingEnforcementForm = () => (
        <>
            <h3>Parking Enforcement</h3>
            <SearchableInput placeholder="Enter TPL site name..." value={site} onChange={setSite} data={tplLocations} />
            <input placeholder="Vehicle Details (Make, Model, Plate)..." value={vehicleDetails} onChange={e => setVehicleDetails(e.target.value)} />
            <select value={actionTaken} onChange={e => setActionTaken(e.target.value as any)}>{parkingActions.map(a => <option key={a} value={a}>{a}</option>)}</select>
            <button className="bigbtn" disabled={!site || !vehicleDetails} onClick={() => handleInitialSubmit('TPL_PARKING', `${now24()} ${status} at ${site}. Parking enforcement initiated.`, { vehicleDetails, actionTaken })}>Log Action & Go Standby</button>
        </>
    );

    const renderGTAMobileFlow = () => {
        switch(step) {
            case 40:
                return (
                    <>
                        <h3>Interchange?</h3>
                        <button className="bigbtn" onClick={() => setStep(41)}>Yes</button>
                        <button className="bigbtn dark" onClick={() => setStep(42)}>No</button>
                    </>
                );
            case 41:
                return (
                    <>
                        <h3>Select Interchange Location</h3>
                        <select value={site} onChange={e => setSite(e.target.value)}><option value="" disabled>Select Location...</option>{interchangeLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}</select>
                        <button className="bigbtn" disabled={!site} onClick={() => handleInitialSubmit('GTA_INTERCHANGE', `${now24()} ${status} at Interchange: ${site}. Awaiting staff.`, { location: site })}>Confirm Arrival & Go Standby</button>
                    </>
                );
            case 42:
                return (
                    <>
                        <h3>Alarm Response?</h3>
                        <button className="bigbtn" onClick={() => setStep(20)}>Yes</button>
                        <button className="bigbtn dark" onClick={() => setStep(10)}>No (Visit TPL Site)</button>
                    </>
                );
            default: return null;
        }
    };

    const getEffectiveMode = (): ShiftMode => {
        if (shift.mode) {
            return shift.mode;
        }
        // Fallback for older shift objects created before 'mode' existed
        if (shift.designation.includes('GTA Mobile')) return 'GTA_MOBILE';
        if (shift.designation.includes('Alarm Response')) return 'TPL_ALARM';
        if (shift.designation.includes('Parking Enforcement')) return 'TPL_PARKING';
        if (shift.designation.includes('Special Site Patrol')) return 'TPL_PATROL';
        return 'TPL_MOBILE';
    };

    const renderStep = () => {
        if (isUpdating) {
            switch(step) {
                case 100: // TPL Patrol Continuation
                    return (
                        <>
                            <h3>Is a guard present at {site}?</h3>
                            <button className="bigbtn" onClick={() => { setGuardPresent(true); setStep(101); }}>Yes</button>
                            <button className="bigbtn dark" onClick={() => { setGuardPresent(false); setStep(103); }}>No</button>
                        </>
                    );
                case 101: // Guard Name
                     return (
                        <>
                            <h3>Guard Name</h3>
                            <input placeholder="Enter guard's name..." value={guardName} onChange={e => setGuardName(e.target.value)} autoFocus />
                            <div className="row">
                                <button className="bigbtn" onClick={() => setStep(102)} disabled={!guardName} style={{flex: 1}}>Enter</button>
                                <button className="bigbtn dark" onClick={() => setStep(102)} style={{flex: 1}}>Skip</button>
                            </div>
                        </>
                    );
                case 102: // Guard Checks
                    const item = guardCheckItems[guardQuestionIndex];
                    return (
                        <>
                            <h3>Guard Check ({guardQuestionIndex + 1}/{guardCheckItems.length})</h3>
                            <p style={{ textAlign: 'center', fontSize: '1.2rem', minHeight: '60px', padding: '10px 0' }}>{item.question}</p>
                            <button className="bigbtn" onClick={() => { const c = [...guardChecks]; c[guardQuestionIndex] = true; setGuardChecks(c); guardQuestionIndex < 3 ? setGuardQuestionIndex(guardQuestionIndex + 1) : setStep(103)}}>Yes</button>
                            <button className="bigbtn dark" onClick={() => { const c = [...guardChecks]; c[guardQuestionIndex] = false; setGuardChecks(c); guardQuestionIndex < 3 ? setGuardQuestionIndex(guardQuestionIndex + 1) : setStep(103)}}>No</button>
                        </>
                    );
                case 103: return renderSharedContinuation();
                case 200: return renderSharedContinuation();
                case 300: return renderSharedContinuation();
                case 400: return renderSharedContinuation();
                case 999: return renderIssueStep();
                default: return null;
            }
        }

        // --- NEW ENTRY FLOWS ---
        if (step === 0) {
            return (
                <>
                    <h3>New Entry: Status</h3>
                    <button className="bigbtn" onClick={() => { setStatus('10-7'); setStep(1); }}>10-7 (Out of service)</button>
                    <button className="bigbtn" onClick={() => { setStatus('10-8'); setStep(1); }}>10-8 (In service)</button>
                </>
            );
        }

        const effectiveMode = getEffectiveMode();

        if (step === 1) {
             switch(effectiveMode) {
                case 'GTA_MOBILE':    setStep(40); return null;
                case 'TPL_ALARM':     return renderAlarmDetailsForm();
                case 'TPL_PARKING':   return renderParkingEnforcementForm();
                default:              return renderTPLPatrolForm();
            }
        }
        
        if (step >= 40) return renderGTAMobileFlow();
        if (step === 20) return renderAlarmDetailsForm();
        if (step === 10) return renderTPLPatrolForm();

        return null;
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
