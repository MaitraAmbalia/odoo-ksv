import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email address');
      setSuccessMsg('');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data?.success) {
        setSuccessMsg(response.data?.message || 'A reset link has been generated.');
        setError('');
      } else {
        setError(response.data?.message || 'Something went wrong');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'User with this email does not exist.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 px-4">
      <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-md border-border shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Forgot Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center flex items-center justify-center gap-2">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 text-sm text-primary bg-primary/10 border border-primary/25 rounded-md text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span>{successMsg}</span>
              </div>
            )}

            {!successMsg && (
              <>
                <Input 
                  label="Email Address" 
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </>
            )}

            <div className="text-center text-sm text-muted-foreground mt-4">
              <Link to="/login" className="text-primary hover:underline font-semibold flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
