import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Space_Grotesk } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MyLittleJarvis — Your Old Phone Becomes Your JARVIS',
  description:
    'Transform your old smartphone into an AI-powered personal assistant. Claude Code-level coding at 15% cost. Deploy your custom AI persona in 3 minutes.',
  keywords: ['JARVIS', 'AI assistant', 'old phone', 'Claude AI', 'personal AI', 'automation'],
  authors: [{ name: 'MyLittleJarvis Team' }],
  openGraph: {
    title: 'MyLittleJarvis — Your Old Phone Becomes Your JARVIS',
    description: 'Transform your old smartphone into an AI-powered personal assistant.',
    type: 'website',
    locale: 'en_US',
    siteName: 'MyLittleJarvis',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MyLittleJarvis — Your Old Phone Becomes Your JARVIS',
    description: 'Transform your old smartphone into an AI-powered personal assistant.',
  },
  themeColor: '#0A0A0F',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="bg-bg-primary text-text-primary font-sans antialiased overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
