import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { api } from '../utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { ThemeToggle } from '../components/ThemeToggle';

export const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    country: '',
    additionalInfo: '',
    companyName: '',
    gstNumber: '',
    category: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName) newErrors.firstName = 'Required';
    if (!formData.lastName) newErrors.lastName = 'Required';
    if (!formData.email) newErrors.email = 'Required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone) newErrors.phone = 'Required';
    if (!formData.role) newErrors.role = 'Required';
    if (!formData.password) newErrors.password = 'Required';
    else if (formData.password.length < 8) newErrors.password = 'Must be at least 8 characters';
    if (!formData.country) newErrors.country = 'Required';

    if (formData.role === 'VENDOR') {
      if (!formData.companyName) newErrors.companyName = 'Required';
      if (!formData.gstNumber) newErrors.gstNumber = 'Required';
      else if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gstNumber)) {
        newErrors.gstNumber = 'Invalid GST format (e.g. 22AAAAA0000A1Z5)';
      }
      if (!formData.category) newErrors.category = 'Required';
    }

    return newErrors;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setSubmitError('');
    try {
      const response = await api.post('/auth/register', formData);
      if (response.data?.success) {
        localStorage.setItem('token', response.data.data.token);
        navigate('/dashboard');
      } else {
        setSubmitError(response.data?.message || 'Registration failed');
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background/50 py-12 px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-[700px] bg-card/40 backdrop-blur-md border-border shadow-xl">
        <CardHeader className="space-y-1 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <UserPlus className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-center">Create Account</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Join VendorBridge as Admin or Vendor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-6">
            {submitError && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/25 rounded-md text-center">
                {submitError}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="First Name" 
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
                required
              />
              <Input 
                label="Last Name" 
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="Email Address" 
                type="email"
                name="email"
                placeholder="john.doe@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />
              <Input 
                label="Phone Number" 
                name="phone"
                placeholder="+1 (555) 000-0000"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Select 
                label="Role" 
                name="role"
                options={[
                  { label: 'Admin', value: 'ADMIN' },
                  { label: 'Vendor', value: 'VENDOR' }
                ]}
                value={formData.role}
                onChange={handleChange}
                error={errors.role}
                required
              />
              <Input 
                label="Country" 
                name="country"
                placeholder="United States"
                value={formData.country}
                onChange={handleChange}
                error={errors.country}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input 
                label="Password" 
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
            </div>

            {formData.role === 'VENDOR' && (
              <div className="p-4 rounded-lg border border-border/50 bg-card/20 space-y-4">
                <h4 className="text-sm font-semibold text-foreground">Vendor Profile Details</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input 
                    label="Company Name" 
                    name="companyName"
                    placeholder="ABC Components Pvt Ltd"
                    value={formData.companyName}
                    onChange={handleChange}
                    error={errors.companyName}
                    required
                  />
                  <Input 
                    label="GST Number" 
                    name="gstNumber"
                    placeholder="22AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    error={errors.gstNumber}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Select 
                    label="Category" 
                    name="category"
                    options={[
                      { label: 'Furniture', value: 'Furniture' },
                      { label: 'Electronics', value: 'Electronics' },
                      { label: 'General', value: 'General' },
                      { label: 'Services', value: 'Services' }
                    ]}
                    value={formData.category}
                    onChange={handleChange}
                    error={errors.category}
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="additionalInfo" className="text-sm font-medium text-muted-foreground">Additional Information</Label>
              <textarea 
                id="additionalInfo"
                name="additionalInfo"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                rows={4}
                placeholder="Tell us a little bit about yourself or your company..."
                value={formData.additionalInfo}
                onChange={handleChange}
              />
            </div>

            <div className="flex flex-col items-center gap-4 pt-4">
              <Button type="submit" className="w-full max-w-[300px]">
                Register
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline font-semibold">
                  Log in
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
