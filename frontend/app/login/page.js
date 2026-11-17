'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/components/ui/Toast';
import Spinner from '@/components/ui/Spinner';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState('admin@doctortracker.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.replace(params.get('from') || '/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="relative hidden w-1/2 flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Activity className="h-6 w-6" />
          </span>
          <span className="text-xl font-semibold">Doctor Tracker</span>
        </div>
        <div>
          <h2 className="text-3xl font-bold leading-tight">
            Manage doctors & patients,
            <br /> all in one secure place.
          </h2>
          <p className="mt-4 max-w-md text-brand-100">
            A fast, modern admin portal with powerful search, filtering, and real-time analytics.
          </p>
        </div>
        <div className="flex gap-8 text-sm text-brand-100">
          <div>
            <p className="text-2xl font-bold text-white">Secure</p>
            <p>JWT-protected routes</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Fast</p>
            <p>Indexed MongoDB queries</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Insightful</p>
            <p>Live dashboards</p>
          </div>
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Right form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Activity className="h-6 w-6" />
              </span>
              <span className="text-xl font-semibold text-slate-900">Doctor Tracker</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your admin credentials to continue.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="label" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  className="input pl-9"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="input pl-9 pr-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? <Spinner className="h-4 w-4 text-white" /> : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500">
            Demo credentials are pre-filled. Default:{' '}
            <span className="font-medium text-slate-700">admin@doctortracker.com / Admin@123</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
