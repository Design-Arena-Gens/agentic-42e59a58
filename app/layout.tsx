import type { Metadata } from 'next';
import './globals.css';
import { Vazirmatn, Playfair_Display } from 'next/font/google';

const vazir = Vazirmatn({ subsets: ['arabic', 'latin'], weight: ['300','400','600','800'] });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['400','700','900'] });

export const metadata: Metadata = {
  title: 'Lunabell ? Viral Demo',
  description: 'Lunabell ? ????? ??? ???? ??. Viral luxury demo video for sunglasses.',
  metadataBase: new URL('https://agentic-42e59a58.vercel.app')
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`${vazir.className} ${playfair.className}`}>
        {children}
      </body>
    </html>
  );
}
