import React, { useState } from 'react';
import { aiService, projectService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const CreateJobPage: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [aiResult, setAiResult] = useState<any>(null);
    const navigate = useNavigate();

    const handleAiParse = async () => {
        if (!input.trim()) return;
        setLoading(true);
        try {
            const result = await aiService.parseTask(input);
            setAiResult(result);
        } catch (error) {
            console.error(error);
            alert('AI Processing Failed');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!aiResult) return;

        // Convert AI result to Project format
        const projectData = {
            title: aiResult.extracted_data.title || 'New AI Project',
            description: aiResult.extracted_data.description || input,
            budget: aiResult.budget_estimate?.range || 'Negotiable',
            skills: (aiResult.extracted_data.skills || []).join(', '),
            category: aiResult.extracted_data.category || 'General',
        };

        try {
            await projectService.create(projectData);
            alert('Project Created Successfully!');
            navigate('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Failed to create project');
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1>🔮 Create Job with AI</h1>
            <p>Just describe what you need, and our AI will structure it for you.</p>

            <div style={{ margin: '2rem 0' }}>
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., I need a modern e-commerce website for my shoe brand. Budget is around $3000..."
                    style={{ width: '100%', height: '150px', padding: '1rem', borderRadius: '8px' }}
                />
                <br />
                <button
                    onClick={handleAiParse}
                    disabled={loading}
                    style={{
                        padding: '1rem 2rem',
                        background: 'linear-gradient(45deg, #6b21a8, #c026d3)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '1rem'
                    }}
                >
                    {loading ? 'AI Processing...' : '✨ Generate Specification'}
                </button>
            </div>

            {aiResult && (
                <div style={{ background: '#f5f5f5', padding: '2rem', borderRadius: '12px' }}>
                    <h2>AI Analysis Result</h2>

                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Title:</strong> {aiResult.extracted_data.title}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Skills Required:</strong>
                        {aiResult.extracted_data.skills?.map((skill: string) => (
                            <span key={skill} style={{
                                background: '#e0e0e0',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                margin: '0 4px',
                                fontSize: '0.9rem'
                            }}>
                                {skill}
                            </span>
                        ))}
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <strong>Estimated Budget:</strong> {aiResult.budget_estimate?.range} ({aiResult.budget_estimate?.confidence} confidence)
                    </div>

                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '1rem 2rem',
                            background: '#059669',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            width: '100%'
                        }}
                    >
                        🚀 Post This Project
                    </button>
                </div>
            )}
        </div>
    );
};

export default CreateJobPage;
