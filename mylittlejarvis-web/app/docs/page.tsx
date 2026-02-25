import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Documentation - MyLittleJarvis',
  description: 'JARVIS documentation has moved to GitBook for a better reading experience.',
}

export default function DocsRedirectPage() {
  // Redirect to GitBook
  redirect('https://docs.mylittlejarvis.com')
  
  // Fallback content (shown during redirect)
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">📚</div>
        <h1 className="text-2xl font-display text-white mb-4">
          Documentation Moved
        </h1>
        <p className="text-text-secondary mb-6">
          Redirecting to GitBook...
        </p>
        <a 
          href="https://docs.mylittlejarvis.com"
          className="text-accent-primary hover:underline"
        >
          Click here if not redirected →
        </a>
      </div>
    </div>
  )
}
