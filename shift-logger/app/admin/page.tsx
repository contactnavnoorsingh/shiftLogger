'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { Shift, User } from '@/types';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

const AdminPanel = () => {
    const [allShifts, setAllShifts] = useState<Shift[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const router = useRouter();

    // Search state
    const [searchName, setSearchName] = useState('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState('');
    const [designation, setDesignation] = useState('');
    const [date, setDate] = useState('');
    const [textSearch, setTextSearch] = useState('');
    
    // Report State
    const [isGeneratingReport, setIsGeneratingReport] = useState<string | null>(null);
    const [reportContent, setReportContent] = useState('');

    const fetchShifts = async (params = {}) => {
        try {
            const { data } = await api.get('/admin/shifts', { params });
            setAllShifts(data.shifts);
        } catch (err) {
            setError('Failed to fetch shift data.');
        }
    };

    useEffect(() => {
        const checkAdminStatusAndFetchData = async () => {
            const userString = localStorage.getItem('user');
            if (!userString) { router.push('/'); return; }
            const user: User = JSON.parse(userString);
            if (!user.isAdmin) { router.push('/'); return; }

            try {
                const [shiftsRes, usersRes] = await Promise.all([
                    api.get('/admin/shifts'),
                    api.get('/admin/users')
                ]);
                setAllShifts(shiftsRes.data.shifts);
                setUsers(usersRes.data.users);
            } catch (err) {
                setError('Failed to fetch initial admin data.');
            } finally {
                setLoading(false);
            }
        };
        checkAdminStatusAndFetchData();
    }, [router]);

    useEffect(() => {
        if (searchName) {
            setFilteredUsers(users.filter(u => u.fullName && u.fullName.toLowerCase().includes(searchName.toLowerCase())));
        } else {
            setFilteredUsers([]);
        }
    }, [searchName, users]);

    const handleSearch = () => {
        const params: any = {};
        if (selectedUserId) params.userId = selectedUserId;
        if (designation) params.designation = designation;
        if (date) params.date = date;
        if (textSearch) params.text = textSearch;
        fetchShifts(params);
    };

    // FIX: When a user is selected from the predictive list, trigger the search immediately.
    const handleUserSelect = (user: User) => {
        setSelectedUserId(user._id);
        setSearchName(user.fullName);
        setFilteredUsers([]);
        // Clear other fields for a clean search
        setDesignation('');
        setDate('');
        setTextSearch('');
        // Trigger search for this user
        fetchShifts({ userId: user._id });
    };
    
    const downloadRawReport = (shift: Shift) => {
        const user = shift.userId as User;
        const header = `Guard: ${user.fullName}\nDate: ${shift.date}\nShift: ${shift.timings}\nDesignation: ${shift.designation}\n\n---\n\n`;
        const body = shift.entries.sort((a,b) => a.time.localeCompare(b.time)).map(e => e.text).join('\n');
        const content = header + body;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ShiftReport_${user.fullName}_${shift.date}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const generateExecutiveSummary = async (shiftId: string) => {
        setIsGeneratingReport(shiftId);
        try {
            const { data } = await api.post('/admin/report', { shiftId });
            setReportContent(data.summary);
        } catch (error: any) {
            const message = error.response?.data?.error || 'Failed to generate summary.';
            setReportContent(message);
        }
    };

    const activeGuards = users.filter(u => u.onlineStatus === 'Online').length;
    const totalShiftsToday = allShifts.filter(s => s.date === new Date().toISOString().slice(0, 10)).length;

    if (loading) return <p style={{ textAlign: 'center', padding: '20px' }}>Loading admin panel...</p>;
    if (error) return <p style={{ color: 'var(--red)', textAlign: 'center', padding: '20px' }}>{error}</p>;

    return (
        <main className="wrap">
            <div className="card section">
                <div className="row" style={{ justifyContent: 'space-between' }}>
                    <h1 style={{ margin: 0 }}>Admin Panel</h1>
                    <button onClick={() => router.push('/')} className="bigbtn ghost" style={{ maxWidth: '180px', margin: 0 }}>Back to Dashboard</button>
                </div>
                <div className="row" style={{ marginTop: '14px', gap: '20px', justifyContent: 'space-around' }}>
                    <div><span className="stat-number">{users.length}</span> Total Guards</div>
                    <div><span className="stat-number">{activeGuards}</span> Guards Online</div>
                    <div><span className="stat-number">{allShifts.length}</span> Total Shifts</div>
                    <div><span className="stat-number">{totalShiftsToday}</span> Shifts Today</div>
                </div>
            </div>

            <div className="card section">
                <h2 style={{marginTop: 0}}>Search Shifts</h2>
                <div className="row" style={{ gap: '12px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        <input type="text" placeholder="Guard Name..." value={searchName} onChange={e => setSearchName(e.target.value)} />
                        {filteredUsers.length > 0 && (
                            <div className="suggestion-list">
                                {filteredUsers.map(user => <div key={user._id} onClick={() => handleUserSelect(user)}>{user.fullName}</div>)}
                            </div>
                        )}
                    </div>
                    <input type="text" placeholder="Designation..." value={designation} onChange={e => setDesignation(e.target.value)} style={{ flex: 1 }}/>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ flex: 1 }}/>
                </div>
                <input type="text" placeholder="Search log text or summary..." value={textSearch} onChange={e => setTextSearch(e.target.value)} style={{ marginTop: '12px' }}/>
                <button onClick={handleSearch} className="bigbtn" style={{ marginTop: '12px' }}>Search</button>
            </div>

            <div className="log-list-container" style={{ background: 'var(--card)'}}>
                {allShifts.length > 0 ? (
                    allShifts.map(shift => (
                        <div key={shift._id} className="card section" style={{ marginBottom: '14px' }}>
                            <div className="row" style={{ justifyContent: 'space-between' }}>
                                <div><strong>{shift.designation}</strong> - {shift.date}</div>
                                <span className={`chip ${shift.status === 'Completed' ? 'dark' : 'green'}`}>{shift.status}</span>
                            </div>
                            <p className="muted">Guard: {(shift.userId as User).fullName || 'N/A'} | Last Login: {formatDistanceToNow(new Date((shift.userId as User).lastLogin || 0))} ago</p>
                            <div className="log-list-container" style={{ marginTop: '8px', padding: '4px' }}>
                                {shift.entries.sort((a,b) => a.time.localeCompare(b.time)).map((entry, index) => (
                                    <div key={index} className="log-item">{entry.text} <span className="muted">({formatDistanceToNow(new Date(entry.createdAt || 0))} ago)</span></div>
                                ))}
                            </div>
                            {shift.summary && <div style={{ marginTop: '10px' }}><strong>Summary:</strong> {shift.summary}</div>}
                            <div className="toolbar" style={{ marginTop: '10px' }}>
                                <button onClick={() => downloadRawReport(shift)} className="bigbtn ghost" style={{flex: 1}}>Download Raw Report</button>
                                <button onClick={() => generateExecutiveSummary(shift._id)} className="bigbtn dark" style={{flex: 1}} disabled={isGeneratingReport === shift._id}>
                                    {isGeneratingReport === shift._id ? 'Generating...' : 'Executive Summary'}
                                </button>
                            </div>
                            {isGeneratingReport === shift._id && (
                                <div className="card section" style={{marginTop: '10px', whiteSpace: 'pre-wrap'}}>{reportContent}</div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="muted" style={{ textAlign: 'center', padding: '20px' }}>No shifts found for the current filters.</p>
                )}
            </div>
        </main>
    );
};

export default AdminPanel;
