import React, { useState } from 'react';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.login({ email, password });
            navigate('/dashboard');
            window.location.reload(); // To update auth state in header
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (

        <div className="max-w-[400px] mx-auto mt-16 p-8 bg-white rounded-xl shadow-md text-gray-900">
            <h2 className="text-center mb-8 text-2xl font-bold">Login to QuantumWorks</h2>
            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                        title="Email address"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 font-medium">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                        title="Password"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                </div>
                <button type="submit" className="w-full p-3 bg-purple-800 text-white rounded-md font-bold hover:bg-purple-900 transition-colors">
                    Log In
                </button>
            </form>
            <div className="text-center mt-4 text-sm">
                Don't have an account? <Link to="/register" className="text-purple-600 hover:underline">Sign up</Link>
            </div>
        </div>
    );
};

export default LoginPage;
