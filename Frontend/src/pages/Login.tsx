import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../utils/api';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      setSuccessMsg('');
      return;
    }
    setError('');
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.success) {
        localStorage.setItem('token', response.data.data.token);
        setSuccessMsg('Successfully logged in! Redirecting...');
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        setError(response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex-center animate-fade-in">
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="flex-col" style={{ alignItems: 'center', marginBottom: '2rem' }}>
          <div className="photo-upload">
            <User size={40} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Login to VendorBridge</p>
        </div>

        <form onSubmit={handleLogin} className="flex-col" style={{ gap: '0.5rem' }}>
          {error && (
            <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{ color: 'var(--primary-color)', fontSize: '0.9rem', marginBottom: '1rem', textAlign: 'center', padding: '0.5rem', border: '1px solid var(--primary-color)', borderRadius: '0.5rem', background: 'rgba(0, 229, 155, 0.1)' }}>
              {successMsg}
            </div>
          )}

          <Input 
            label="Username / Email" 
            type="text"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input 
            label="Password" 
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', marginTop: '-0.5rem' }}>
            <a href="#" style={{ fontSize: '0.875rem' }}>Forgot password?</a>
          </div>

          <Button type="submit" style={{ width: '100%', marginBottom: '1.5rem' }}>
            Login
          </Button>

          <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: '600' }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
