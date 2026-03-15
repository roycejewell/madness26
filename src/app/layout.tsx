import type { Metadata } from 'next';
import { Press_Start_2P, VT323 } from 'next/font/google';
import './globals.css';

const pressStart = Press_Start_2P({
  weight: '400',
  variable: '--font-press-start',
  subsets: ['latin'],
});

const vt323 = VT323({
  weight: '400',
  variable: '--font-vt323',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'March Madness Snake Draft',
  description: 'Snake draft scorer for March Madness',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body className="min-h-[100dvh] antialiased">
        {children}
      </body>
    </html>
  );
}
