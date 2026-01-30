import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';
import { isEmailAllowed } from './utils/allowlist';

// Custom error types for better error handling
class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Missing credentials');
        }

        // SECURITY LAYER 2: Check allowlist BEFORE validating credentials
        if (!isEmailAllowed(credentials.email)) {
          console.warn(`🚫 Access denied for unauthorized email: ${credentials.email}`);
          throw new AuthError(
            'This email is not authorized to access Chatita',
            'UNAUTHORIZED_EMAIL'
          );
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        // Handle OAuth users who don't have passwords
        if (!user.password) {
          throw new Error('Please sign in with your OAuth provider');
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValidPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    // Optional: Google OAuth (only enabled if credentials are configured)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  pages: {
    signIn: '/login',
    newUser: '/onboarding/welcome',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    // SECURITY LAYER 3: Validate email during OAuth sign-in
    async signIn({ user, account }) {
      if (!user.email) {
        console.warn('🚫 Sign-in blocked: No email provided');
        return false;
      }

      // Check allowlist for all sign-in attempts
      if (!isEmailAllowed(user.email)) {
        console.warn(`🚫 Access denied for unauthorized email: ${user.email}`);

        // For OAuth providers, redirect with error
        if (account?.provider !== 'credentials') {
          return `/auth/access-denied?email=${encodeURIComponent(user.email)}`;
        }

        // For credentials, throw error (handled by authorize)
        return false;
      }

      console.log(`✅ Sign-in allowed for: ${user.email}`);
      return true;
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
      }
      return token;
    },

    // SECURITY LAYER 4: Validate session on every request
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;

        // Re-validate email allowlist on every session request
        // This ensures users lose access immediately if removed from allowlist
        if (session.user.email && !isEmailAllowed(session.user.email)) {
          console.warn(`🚫 Session invalidated for removed email: ${session.user.email}`);
          throw new Error('Your access has been revoked. Please contact support.');
        }
      }
      return session;
    },
  },
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`👤 User signed in: ${user.email} (new: ${isNewUser})`);
    },
    async signOut({ token }) {
      console.log(`👋 User signed out: ${token.email}`);
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
