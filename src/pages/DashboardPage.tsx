import React, { useEffect, useState } from 'react';
import { proposalService, authService } from '../services/api';
import { Link } from 'react-router-dom';
import ContractChat from '../components/ContractChat';

const DashboardPage: React.FC = () => {
    const [contracts, setContracts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [activeChat, setActiveChat] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Fetch contracts and current user in parallel
            const [contractsData, userData] = await Promise.all([
                proposalService.getMyContracts(),
                authService.getCurrentUser().catch(() => null)
            ]);
            setContracts(contractsData);
            setCurrentUser(userData);
        } catch (error) {
            console.error("Dashboard Load Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1>🚀 Dashboard</h1>
                <Link to="/post-job" style={{
                    padding: '0.75rem 1.5rem',
                    background: '#6b21a8',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    fontWeight: 'bold'
                }}>
                    + Post New Job
                </Link>
            </div>

            <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h2>My Active Contracts</h2>

                {contracts.length === 0 ? (
                    <p style={{ color: '#666' }}>No active contracts yet.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {contracts.map(contract => (
                            <div key={contract.id} style={{ border: '1px solid #ddd', padding: '1rem', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>Contract #{contract.id}</strong>
                                    <span style={{
                                        background: contract.status === 'active' ? '#dcfce7' : '#f3f4f6',
                                        color: contract.status === 'active' ? '#166534' : '#374151',
                                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem'
                                    }}>
                                        {contract.status}
                                    </span>
                                </div>
                                <div style={{ marginTop: '0.5rem' }}>
                                    <strong>Amount:</strong> ${contract.amount}
                                </div>

                                <button
                                    onClick={() => setActiveChat(activeChat === contract.id ? null : contract.id)}
                                    style={{ marginTop: '1rem', padding: '8px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {activeChat === contract.id ? 'Close Chat' : 'Open Chat'}
                                </button>

                                {activeChat === contract.id && currentUser && (
                                    <ContractChat contractId={contract.id} userId={currentUser.id} />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '3rem' }}>
                <Link to="/jobs" style={{ padding: '0.5rem 1rem', background: '#e0e7ff', borderRadius: '6px', textDecoration: 'none', color: '#3730a3' }}>
                    Browse Marketplace
                </Link>
            </div>
        </div>
    );
};

export default DashboardPage;
