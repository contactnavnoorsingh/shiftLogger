import React from 'react';
import type { Entry } from '@/types';

interface InProgressLogCardProps {
  entry: Entry;
  onContinue: () => void;
}

const InProgressLogCard: React.FC<InProgressLogCardProps> = ({ entry, onContinue }) => {
    return (
        <section className="card section" style={{ background: 'var(--warn)', color: 'var(--bg)' }}>
            <h3 style={{ marginTop: 0 }}>Log in Progress...</h3>
            <p style={{ margin: '0 0 12px 0' }}>
                <strong>Last action:</strong> {entry.text}
            </p>
            <button 
                className="bigbtn" 
                onClick={onContinue} 
                style={{ background: 'var(--bg2)', color: 'var(--text)' }}
            >
                Continue Log
            </button>
        </section>
    );
};

export default InProgressLogCard;
