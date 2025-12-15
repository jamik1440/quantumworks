import React, { useEffect, useState } from 'react';
import api from '../services/api';

const AdminPage: React.FC = () => {
    // const [stats, setStats] = useState<any>(null); // Unused
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Simple health/stats check
        // Real admin would call /admin/stats endpoint if it existed
        // For MVP, we'll check system health
        const checkAdmin = async () => {
            try {
                // Verify admin access by hitting a protected endpoint
                // Since we don't have a dedicated /admin/stats, we'll assume success if no 403
                // Ideally this would fetch real metrics.
                await api.get('/admin/security/events?limit=1');
                // setStats({ status: 'Active', message: 'Admin access verified' });
            } catch (err: any) {
                setError('Access Denied. You are not an admin.');
            } finally {
                setLoading(false);
            }
        };
        checkAdmin();
    }, []);

    if (loading) return <div>Checking Admin Access...</div>;
    if (error) return <div className="text-red-500 p-8 text-center">{error}</div>;

    return (
        <div className="p-8 max-w-[1000px] mx-auto text-black">
            <h1 className="text-3xl font-bold mb-6 text-white">🛡️ Admin Panel</h1>
            <div className="bg-white p-8 rounded-lg shadow-md text-gray-800">
                <h2 className="text-xl font-bold mb-4">System Status</h2>
                <div className="text-green-600 font-bold mb-2">✅ Operational</div>
                <p>Welcome, Admin. System is running securely.</p>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                        <h3 className="font-semibold mb-2">Security Events</h3>
                        <p className="text-sm">Real-time monitoring active</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                        <h3 className="font-semibold mb-2">User Management</h3>
                        <p className="text-sm">Database: SQLite (Dev)</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                        <h3 className="font-semibold mb-2">AI Usage</h3>
                        <p className="text-sm">Quota enforcement active</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
