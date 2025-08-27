import React, { useState } from 'react';

interface EndShiftModalProps {
  userFullName: string;
  onClose: () => void;
  onConfirm: (confirmationName: string) => void;
  isEnding: boolean;
}

const EndShiftModal: React.FC<EndShiftModalProps> = ({ userFullName, onClose, onConfirm, isEnding }) => {
    const [confirmationName, setConfirmationName] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (confirmationName.toLowerCase() !== userFullName.toLowerCase()) {
            setError('Full name does not match. Please try again.');
            return;
        }
        setError('');
        onConfirm(confirmationName);
    };

    return (
        <div className="backdrop show">
            <div className="modal">
                <h3>Confirm End of Shift</h3>
                <p>To finalize this shift and generate the summary, please type your full name below for confirmation.</p>
                <p className="muted">Your name: <strong>{userFullName}</strong></p>
                <input 
                    placeholder="Type your full name here..."
                    value={confirmationName}
                    onChange={e => setConfirmationName(e.target.value)}
                />
                {error && <p style={{ color: 'var(--red)', textAlign: 'center' }}>{error}</p>}
                <button onClick={handleConfirm} className="bigbtn" disabled={isEnding}>
                    {isEnding ? 'Finalizing...' : 'Confirm & End Shift'}
                </button>
                <button onClick={onClose} className="bigbtn ghost" disabled={isEnding}>Cancel</button>
            </div>
        </div>
    );
};

export default EndShiftModal;
