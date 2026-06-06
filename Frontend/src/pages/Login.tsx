import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ThemeToggle } from '../components/ThemeToggle';

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
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
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
    <div className="relative min-h-screen flex items-center justify-center bg-background/50 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-md border-border shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <LogIn className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Login to your VendorBridge ERP account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center flex items-center justify-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-sm text-primary bg-primary/10 border border-primary/25 rounded-md text-center">
                {successMsg}
              </div>
            )}

            <Input 
              label="Username / Email" 
              type="text"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input 
              label="Password" 
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex justify-end text-sm">
              <Link to="/forgot-password" className="text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full mt-2">
              Login
            </Button>

            <div className="text-center text-sm text-muted-foreground mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
