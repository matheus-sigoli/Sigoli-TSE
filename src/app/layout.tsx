import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sigoli-tse.vercel.app'),
  title: { default: 'Sigoli.TSE — Eleições 2026 por município', template: '%s · Sigoli.TSE' },
  description:
    'Resultados das Eleições 2026 para Presidente, Governador e Senador, município por município, com dados oficiais do TSE.',
  openGraph: { type: 'website', locale: 'pt_BR', siteName: 'Sigoli.TSE' },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#1d1f23' },
    { media: '(prefers-color-scheme: light)', color: '#e9ebee' },
  ],
};

// Aplica tema e modo daltônico antes da pintura (sem piscar).
const preferencias = `try{var d=document.documentElement,t=localStorage.getItem('sigoli:tema');d.dataset.theme=t==='claro'?'claro':'escuro';if(localStorage.getItem('sigoli:daltonico')==='1')d.dataset.daltonico='1'}catch(e){document.documentElement.dataset.theme='escuro'}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="escuro" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: preferencias }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
