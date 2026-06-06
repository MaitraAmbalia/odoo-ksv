import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldAlert, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !userId) {
      setError('Invalid reset link parameters. Please check your link.');
      return;
    }
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        userId,
        token,
        newPassword
      });
      if (response.data?.success) {
        setSuccessMsg('Your password has been reset successfully! Redirecting to login...');
        setError('');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setError(response.data?.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background/50 px-4">
      <Card className="w-full max-w-[420px] bg-card/40 backdrop-blur-md border-border shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Reset Password</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Set your new account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            {(!token || !userId) && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center">
                Invalid or missing reset token parameters in URL.
              </div>
            )}
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

            {!successMsg && token && userId && (
              <>
                <Input 
                  label="New Password" 
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />

                <Input 
                  label="Confirm Password" 
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                  {isLoading ? 'Resetting...' : 'Reset Password'}
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
