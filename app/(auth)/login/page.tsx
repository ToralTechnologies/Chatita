'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/home');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signIn('google', { callbackUrl: '/home' });
    } catch {
      setError('Failed to sign in with Google');
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid rgba(1,35,116,0.15)',
    background: '#F7EFE1',
    fontSize: '14px',
    color: '#001A4D',
    outline: 'none',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: '#F7EFE1' }}
    >
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.svg"
            alt="Chatita"
            width={160}
            height={64}
            className="mx-auto mb-5"
          />
          <h1
            className="font-serif-italic"
            style={{ fontSize: '1.5rem', color: '#012374', marginBottom: '4px' }}
          >
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: 'rgba(1,35,116,0.55)' }}>
            Sign in to continue
          </p>
        </div>

        {/* Card */}
        <div
          className="p-7"
          style={{
            background: '#FFFDF9',
            borderRadius: '26px',
            border: '1px solid rgba(1,35,116,0.07)',
            boxShadow: '0 24px 50px -28px rgba(1,35,116,0.22)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div
                className="text-sm p-3 rounded-[12px]"
                style={{ background: 'rgba(208,2,27,0.08)', color: '#D0021B', border: '1px solid rgba(208,2,27,0.2)' }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'rgba(1,35,116,0.62)' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={inputStyle}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold mb-1.5"
                style={{ color: 'rgba(1,35,116,0.62)' }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold transition-all disabled:opacity-50"
              style={{
                borderRadius: '999px',
                background: '#012374',
                color: '#FFFDF9',
                boxShadow: '0 10px 22px -10px rgba(1,35,116,0.5)',
                marginTop: '8px',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px" style={{ background: 'rgba(1,35,116,0.1)' }} />
            <span className="text-xs font-semibold" style={{ color: 'rgba(1,35,116,0.4)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(1,35,116,0.1)' }} />
          </div>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3 text-sm font-semibold transition-all disabled:opacity-50"
            style={{
              borderRadius: '999px',
              border: '1px solid rgba(1,35,116,0.2)',
              background: '#FFFDF9',
              color: '#001A4D',
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Sign in with Google
          </button>

          <div className="mt-5 text-center">
            <p className="text-sm" style={{ color: 'rgba(1,35,116,0.6)' }}>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="font-semibold" style={{ color: '#012374' }}>
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-3 text-center text-[11px] space-x-3" style={{ color: 'rgba(1,35,116,0.45)' }}>
            <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:underline">Terms of Use</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
