import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
    return (
        <div>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: 'white',
                padding: '5rem 2rem',
                textAlign: 'center',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    Future of Freelancing
                </h1>
                <p style={{ fontSize: '1.25rem', maxWidth: '600px', marginBottom: '3rem', color: '#94a3b8' }}>
                    AI-powered matching, secure escrow contracts, and a next-gen workspace for elite talent.
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Link to="/post-job" style={{
                        padding: '1rem 2rem',
                        background: '#a855f7',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '99px',
                        fontWeight: 'bold',
                        fontSize: '1.1rem'
                    }}>
                        Create Job with AI
                    </Link>
                    <Link to="/jobs" style={{
                        padding: '1rem 2rem',
                        background: 'rgba(255,255,255,0.1)',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: '99px',
                        fontSize: '1.1rem',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                        Browse Jobs
                    </Link>
                </div>
            </div>

            {/* Features */}
            <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '5rem 2rem' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Why QuantumWorks?</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3 style={{ color: '#6b21a8' }}>AI-First</h3>
                        <p>Describe your project in plain english, and our AI generates a technical specification instantly.</p>
                    </div>
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3 style={{ color: '#059669' }}>Secure Escrow</h3>
                        <p>Funds are held safely until milestones are met. Trust is built-in by default.</p>
                    </div>
                    <div style={{ padding: '2rem', background: '#f8fafc', borderRadius: '12px' }}>
                        <h3 style={{ color: '#2563eb' }}>Smart Matching</h3>
                        <p>Our algorithm finds the perfect talent match based on skills, verified history, and availability.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
