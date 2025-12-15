import React, { useState } from 'react';
import { authService } from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const RegisterPage: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'freelancer'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await authService.register(formData);
            // Auto login after register
            await authService.login({ email: formData.email, password: formData.password });
            navigate('/dashboard');
            window.location.reload();
        } catch (err) {
            setError('Registration failed. Email might be taken.');
        }
    };

    return (

        <div className="max-w-[400px] mx-auto mt-16 p-8 bg-white rounded-xl shadow-md text-gray-900">
            <h2 className="text-center mb-8 text-2xl font-bold">Join QuantumWorks</h2>
            {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Full Name</label>
                    <input
                        type="text"
                        value={formData.full_name}
                        onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                        required
                        placeholder="Enter your full name"
                        title="Full Name"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Email</label>
                    <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="Enter your email"
                        title="Email Address"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                </div>
                <div className="mb-4">
                    <label className="block mb-2 font-medium">Password</label>
                    <input
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        placeholder="Create a password"
                        title="Password"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                </div>
                <div className="mb-6">
                    <label className="block mb-2 font-medium">I want to...</label>
                    <select
                        value={formData.role}
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        title="Select Role"
                        className="w-full p-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    >
                        <option value="freelancer">Find Work (Freelancer)</option>
                        <option value="employer">Hire Talent (Employer)</option>
                    </select>
                </div>
                <button type="submit" className="w-full p-3 bg-emerald-600 text-white rounded-md font-bold hover:bg-emerald-700 transition-colors">
                    Sign Up
                </button>
            </form>
            <div className="text-center mt-4 text-sm">
                Already have an account? <Link to="/login" className="text-emerald-600 hover:underline">Log in</Link>
            </div>
        </div>
    );
};

export default RegisterPage;
