import React, { useEffect, useState } from 'react';
import { projectService } from '../services/api';
import { Link } from 'react-router-dom';

const JobsPage: React.FC = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
            <h1>🌌 Marketplace</h1>
            <p>Find the perfect project for your skills.</p>

            <div style={{ display: 'grid', gap: '1.5rem', marginTop: '2rem' }}>
                {projects.map((project) => (
                    <div key={project.id} style={{
                        border: '1px solid #ddd',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        background: 'white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{project.title}</h3>
                            <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '0.875rem'
                            }}>
                                {project.budget}
                            </span>
                        </div>

                        <p style={{ color: '#666', fontSize: '0.95rem' }}>
                            {project.description.substring(0, 150)}...
                        </p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                            {project.skills.split(',').map((skill: string) => (
                                <span key={skill} style={{
                                    border: '1px solid #ddd',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    color: '#666'
                                }}>
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>

                        <Link to={`/jobs/${project.id}`} style={{
                            display: 'inline-block',
                            marginTop: '1rem',
                            color: '#2563eb',
                            textDecoration: 'none',
                            fontWeight: '500'
                        }}>
                            View Details →
                        </Link>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        No active jobs found. Be the first to post one!
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobsPage;
