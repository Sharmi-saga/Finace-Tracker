import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';

export const metadata: Metadata = {
  title: 'Finance Tracker - Plan. Track. Grow.',
  description: 'Modern financial tracker for personal and business accounts, budgets and reports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased text-slate-800">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
