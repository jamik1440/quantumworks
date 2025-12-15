import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { projectService, proposalService } from '../services/api';

const JobDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Proposal form state
    const [coverLetter, setCoverLetter] = useState('');
    const [price, setPrice] = useState('');
    const [days, setDays] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (id) loadProject(parseInt(id));
    }, [id]);

    const loadProject = async (projectId: number) => {
        try {
            const data = await projectService.getById(projectId);
            setProject(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleProposalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        setSubmitting(true);
        try {
            await proposalService.create(parseInt(id), {
                cover_letter: coverLetter,
                price_quote: parseFloat(price),
                estimated_days: parseInt(days)
            });
            alert('Proposal Submitted Successfully!');
            setCoverLetter('');
            setPrice('');
            setDays('');
        } catch (error) {
            alert('Failed to submit proposal (You might need to be logged in as a Freelancer)');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (!project) return <div>Project not found</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            {/* Project Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{project.title}</h1>
                <div style={{ color: '#666', marginBottom: '1rem' }}>
                    Posted by <strong>{project.author_name}</strong> • {new Date(project.created_at).toLocaleDateString()}
                </div>

                <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '8px',
                    borderLeft: '4px solid #3b82f6'
                }}>
                    <h3 style={{ marginTop: 0 }}>Budget: {project.budget}</h3>
                    <p>{project.description}</p>
                </div>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '3rem' }}>
                <h3>Skills Required</h3>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {project.skills.split(',').map((skill: string) => (
                        <span key={skill} style={{
                            background: '#e0e0e0',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.9rem'
                        }}>
                            {skill.trim()}
                        </span>
                    ))}
                </div>
            </div>

            {/* PROPOSALS LIST (Only visible to Author) */}
            {project.proposals && project.proposals.length > 0 && (
                <div style={{ marginTop: '3rem', borderTop: '2px solid #eee', paddingTop: '2rem' }}>
                    <h2>Received Proposals ({project.proposals.length})</h2>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {project.proposals.map((prop: any) => (
                            <div key={prop.id} style={{
                                border: '1px solid #ddd',
                                padding: '1.5rem',
                                borderRadius: '8px',
                                background: '#fff'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <strong>Freelancer ID: {prop.freelancer_id}</strong>
                                    <span style={{ color: '#2563eb', fontWeight: 'bold' }}>${prop.price_quote}</span>
                                </div>
                                <p>{prop.cover_letter}</p>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                                    Duration: {prop.estimated_days} days • Status: {prop.status}
                                </div>

                                {prop.status === 'pending' && (
                                    <button
                                        onClick={async () => {
                                            if (window.confirm('Accept this proposal and start contract?')) {
                                                try {
                                                    await proposalService.accept(prop.id);
                                                    alert('Contract Started!');
                                                    window.location.reload();
                                                } catch (e) { alert('Error accepting proposal'); }
                                            }
                                        }}
                                        style={{
                                            background: '#059669',
                                            color: 'white',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Accept Proposal
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Proposal Form (Only visible if NOT author) */}
            {(!project.proposals) && (
                <div style={{ borderTop: '1px solid #eee', paddingTop: '2rem' }}>
                    <h2>Submit a Proposal</h2>
                    <form onSubmit={handleProposalSubmit} style={{ maxWidth: '600px' }}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Cover Letter</label>
                            <textarea
                                value={coverLetter}
                                onChange={(e) => setCoverLetter(e.target.value)}
                                required
                                style={{ width: '100%', height: '150px', padding: '0.5rem' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Bid Amount ($)</label>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem' }}>Estimated Days</label>
                                <input
                                    type="number"
                                    value={days}
                                    onChange={(e) => setDays(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '0.5rem' }}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                padding: '1rem 2rem',
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '1rem'
                            }}
                        >
                            {submitting ? 'Sending...' : 'Send Proposal'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default JobDetailsPage;
