import React, { useState } from 'react';
import { useAuth } from '../lib/authContext.jsx';
import { FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button.jsx';
import { Input } from './ui/Input.jsx';

export function Auth() {
  const { login, register, authError, clearError, isConfigured } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        await register(email.trim(), password, displayName.trim());
      } else {
        await login(email.trim(), password);
      }
    } catch (err) {
      // Error is caught and surfaced via authContext or local error
    } finally {
      setLoading(false);
    }
  };

  const errorMessage = localError || authError;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm mb-3">
            <FileText className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">DocuMind</h1>
          <p className="text-sm text-slate-500 mt-1">
            Intelligent PDF Assistant powered by RAG
          </p>
        </div>

        {/* Configuration notice if Firebase keys are missing */}
        {!isConfigured && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Firebase configuration pending</p>
              <p className="mt-0.5 text-amber-700">
                To connect to Firebase Auth, add your project credentials to{' '}
                <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">
                  client/.env
                </code>{' '}
                using <code className="bg-amber-100 px-1 py-0.5 rounded font-mono">client/.env.example</code>.
              </p>
            </div>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              clearError();
              setLocalError('');
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              !isRegisterMode
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              clearError();
              setLocalError('');
            }}
            className={`flex-1 pb-3 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              isRegisterMode
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <div>
              <label
                htmlFor="displayName"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Full Name (optional)
              </label>
              <Input
                id="displayName"
                type="text"
                autoComplete="name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              autoComplete={isRegisterMode ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            loading={loading}
            className="w-full mt-2"
          >
            {isRegisterMode ? 'Create Account' : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
