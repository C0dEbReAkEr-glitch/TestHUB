import React, { useState } from 'react';
import { authService } from '../../services/auth';
import { Eye, EyeOff, Mail, Lock, User, UserPlus, GraduationCap } from 'lucide-react';
import { Domain } from '../../types';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export default function RegisterForm({ onToggleMode }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'faculty',
    domain: [] as Domain[],
    section: 'A' as 'A' | 'B'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDomainChange = (domain: Domain) => {
    setFormData(prev => ({
      ...prev,
      domain: prev.domain.includes(domain)
        ? prev.domain.filter(d => d !== domain)
        : [...prev.domain, domain]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.domain.length === 0) {
      setError('Please select at least one domain');
      setLoading(false);
      return;
    }

    try {
      await authService.signUp({
        email: formData.email,
        name: formData.name,
        role: formData.role,
        domain: formData.domain,
        section: formData.section,
        password: formData.password
      });
    } catch (error: any) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-blue-100">Join JIMS TestHub today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-100 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your full name"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Confirm
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-300" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-10 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="Confirm"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-300 hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Role
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['student', 'faculty'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, role: role as 'student' | 'faculty' }))}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.role === role
                    ? 'border-blue-400 bg-blue-500/20 text-white'
                    : 'border-white/20 bg-white/10 text-blue-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="capitalize">{role}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-blue-100 mb-2">
            Domain(s) {formData.role === 'faculty' ? '(Can select multiple)' : ''}
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['BCA', 'MCA', 'PGDM'] as Domain[]).map((domain) => (
              <button
                key={domain}
                type="button"
                onClick={() => {
                  if (formData.role === 'student') {
                    setFormData(prev => ({ ...prev, domain: [domain] }));
                  } else {
                    handleDomainChange(domain);
                  }
                }}
                className={`p-2 rounded-lg border-2 transition-all ${
                  formData.domain.includes(domain)
                    ? 'border-blue-400 bg-blue-500/20 text-white'
                    : 'border-white/20 bg-white/10 text-blue-200 hover:border-blue-400'
                }`}
              >
                <span className="text-sm font-medium">{domain}</span>
              </button>
            ))}
          </div>
        </div>

        {formData.role === 'student' && (
          <div>
            <label className="block text-sm font-medium text-blue-100 mb-2">
              Section
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['A', 'B'] as const).map((section) => (
                <button
                  key={section}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, section }))}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.section === section
                      ? 'border-blue-400 bg-blue-500/20 text-white'
                      : 'border-white/20 bg-white/10 text-blue-200 hover:border-blue-400'
                  }`}
                >
                  <span className="font-medium">Section {section}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-blue-100">
          Already have an account?{' '}
          <button
            onClick={onToggleMode}
            className="text-blue-300 hover:text-white font-medium underline"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}