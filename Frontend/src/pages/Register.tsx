import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { api } from '../utils/api';

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
    avatar: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const navigate = useNavigate();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

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
    <div className="min-h-screen flex-center animate-fade-in" style={{ padding: '2rem 0' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '700px' }}>
        <div className="flex-col" style={{ alignItems: 'center', marginBottom: '2.5rem' }}>
          <div 
            className="photo-upload" 
            title="Upload Photo"
            onClick={() => document.getElementById('avatar-input')?.click()}
          >
            {formData.avatar ? (
              <img src={formData.avatar} alt="Avatar Preview" className="photo-preview" />
            ) : (
              <Upload size={32} />
            )}
          </div>
          <input 
            id="avatar-input"
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
          />
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Join VendorBridge as Admin or Vendor</p>
        </div>

        <form onSubmit={handleRegister}>
          {submitError && (
            <div style={{ color: 'var(--error-color)', fontSize: '0.875rem', marginBottom: '1.5rem', textAlign: 'center' }}>
              {submitError}
            </div>
          )}
          <div className="grid-2-cols">
            <Input 
              label="First Name" 
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
            />
            <Input 
              label="Last Name" 
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
            />
          </div>

          <div className="grid-2-cols">
            <Input 
              label="Email Address" 
              type="email"
              name="email"
              placeholder="john.doe@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Input 
              label="Phone Number" 
              name="phone"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={handleChange}
              error={errors.phone}
            />
          </div>

          <div className="grid-2-cols">
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
            />
            <Input 
              label="Password" 
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />
          </div>

          <div className="grid-2-cols">
            <Input 
              label="Country" 
              name="country"
              placeholder="United States"
              value={formData.country}
              onChange={handleChange}
              error={errors.country}
            />
          </div>

          <div className="input-group" style={{ marginBottom: '2rem' }}>
            <label className="input-label">Additional Information</label>
            <textarea 
              name="additionalInfo"
              className="input-field" 
              rows={4}
              placeholder="Tell us a little bit about yourself or your company..."
              style={{ resize: 'vertical' }}
              value={formData.additionalInfo}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
            <Button type="submit" style={{ width: '100%', maxWidth: '300px' }}>
              Register
            </Button>
            
            <div style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ fontWeight: '600' }}>
                Log in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
