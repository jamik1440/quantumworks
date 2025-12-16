import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth(); // Use context

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await authService.login({ email, password });
            // Update context state
            // data.user should be available from backend response. If not, we might need to fetch it or use what's returned.
            // Based on backend/main.py login returns:
            // { access_token, refresh_token, token_type, user: {id, email, full_name, role} }

            // We need to match what AuthContext expects (User object + token).
            // AuthContext.login(userData: User, token: string)

            if (data.user && data.access_token) {
                const userForContext = {
                    ...data.user,
                    name: data.user.full_name,
                    token: data.access_token
                };
                login(userForContext, data.access_token);
                navigate('/dashboard');
            } else {
                setError('Login succeeded but invalid response format.');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.detail || 'Invalid credentials');
        }
    };

    return (

        <div className="max-w-[400px] mx-auto mt-16 p-8 bg-white rounded-xl shadow-md text-gray-900">
            <h2 className="text-center mb-8 text-2xl font-bold">Login to QuantumWorks</h2>
            {error && <div className="text-red-500 mb-4 text-center bg-red-50 p-2 rounded">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
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
