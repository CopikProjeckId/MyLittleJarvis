import fs from 'fs/promises'
import path from 'path'
import { cache } from 'react'
import type { SiteConfig, DocsSidebarSection, DocsSidebarItem, DocsIndexSection } from './config-types'

export type { SiteConfig, DocsSidebarSection, DocsSidebarItem, DocsIndexSection } from './config-types'

const CONFIG_PATH = path.join(process.cwd(), 'subscript-config.json')

export const getConfig = cache(async (): Promise<SiteConfig> => {
  try {
    const data = await fs.readFile(CONFIG_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error loading config:', error)
    // Return default config if file doesn't exist
    return getDefaultConfig()
  }
})

function getDefaultConfig(): SiteConfig {
  return {
    site: {
      name: 'MyLittleJarvis',
      tagline: 'Your Old Phone Becomes Your JARVIS',
      description: 'Transform your old smartphone into an AI-powered personal assistant.'
    },
    navigation: {
      home: 'Home',
      docs: 'Docs',
      about: 'About',
      faq: 'FAQ',
      blog: 'Blog',
      changelog: 'Changelog',
      getStarted: 'Get Started'
    },
    home: {
      hero: {
        title: "Your Old Phone Becomes Your",
        titleHighlight: "JARVIS",
        subtitle: "Transform your old smartphone into an AI-powered personal assistant. Claude Code-level coding at 15% cost. Deploy your custom AI persona in 3 minutes.",
        ctaPrimary: "Get Started Free",
        ctaSecondary: "See How It Works",
        badge1: "⚡ Claude AI Powered",
        badge2: "📱 Any Old Phone",
        badge3: "🚀 3-Min Setup"
      },
      features: {
        title: "Three Core Capabilities",
        subtitle: "Your JARVIS combines cutting-edge AI with hardware you already own",
        cards: [
          {
            icon: "📱",
            title: "Old Phone → AI Brain",
            description: "Transform any Android 8.0+ device into a powerful AI assistant. 3GB RAM minimum, no root required."
          },
          {
            icon: "⚡",
            title: "Claude Code Included",
            description: "AI-powered coding assistance that rivals Claude Pro at 15% of the cost."
          },
          {
            icon: "🎭",
            title: "Custom Personas",
            description: "Switch between different AI personalities for different tasks."
          }
        ]
      },
      terminal: {
        title: "Installation via Terminal",
        subtitle: "One command to rule them all. Your JARVIS awakens in minutes.",
        steps: [
          "git clone https://github.com/mylittlejarvis/jarvis-agent.git",
          "cd jarvis-agent && npm install",
          "cp .env.example .env",
          "./setup.sh"
        ]
      },
      installation: {
        title: "Deploy in 3 Minutes",
        steps: [
          { number: "01", title: "Clone Repository", desc: "Download the agent code" },
          { number: "02", title: "Install Dependencies", desc: "Run npm install" },
          { number: "03", title: "Configure", desc: "Add your API keys" },
          { number: "04", title: "Run Setup", desc: "Execute setup script" },
          { number: "05", title: "Connect Phone", desc: "Scan QR code" },
          { number: "06", title: "Choose Persona", desc: "Select AI personality" },
          { number: "07", title: "Start Using", desc: "Begin chatting" }
        ]
      }
    },
    about: {
      hero: {
        title: "About MyLittleJarvis",
        subtitle: "Transforming e-waste into intelligent assistants."
      },
      mission: {
        title: "Our Mission",
        paragraphs: [
          "Every year, millions of smartphones end up in landfills.",
          "MyLittleJarvis bridges this gap by giving old phones new life."
        ],
        stats: [
          { value: "15%", label: "Cost vs Claude Pro" },
          { value: "3min", label: "Setup Time" },
          { value: "Zero", label: "New Hardware" }
        ]
      },
      team: {
        title: "Built by AI Enthusiasts",
        members: [
          { name: "AIR", role: "Founder", desc: "Multi-Agent Orchestration expert" }
        ]
      },
      values: {
        title: "Our Values",
        items: [
          { icon: "🌍", title: "Accessibility", desc: "AI for everyone" },
          { icon: "♻️", title: "Sustainability", desc: "Reduce e-waste" }
        ]
      }
    },
    faq: {
      hero: {
        title: "Frequently Asked Questions",
        subtitle: "Everything you need to know about MyLittleJarvis."
      },
      questions: [],
      cta: {
        title: "Still have questions?",
        subtitle: "Check documentation or contact us.",
        primary: "Read Documentation",
        secondary: "Join Discord"
      }
    },
    blog: {
      meta: {
        title: "Blog - MyLittleJarvis",
        description: "Latest news, tutorials, and insights about MyLittleJarvis and AI technology."
      },
      hero: {
        title: "Blog",
        subtitle: "Latest news, tutorials, and insights about MyLittleJarvis and the future of accessible AI."
      },
      filters: ["All", "Release", "Tutorial", "Guide", "Technical"],
      newsletter: {
        title: "Subscribe to updates",
        subtitle: "Get notified when we publish new articles and release updates.",
        placeholder: "Enter your email",
        button: "Subscribe"
      },
      posts: []
    },
    changelog: {
      meta: {
        title: "Changelog - MyLittleJarvis",
        description: "Version history and release notes for MyLittleJarvis."
      },
      hero: {
        badge: "📋",
        badgeText: "Version History",
        title: "What's",
        titleHighlight: "New",
        subtitle: "Every update, improvement, and fix — tracked here. Subscribe to our",
        feedLinkText: "release feed",
        subtitleSuffix: "to stay current."
      },
      releases: []
    },
    docs: {
      meta: {
        title: "Documentation - MyLittleJarvis",
        description: "Complete documentation for MyLittleJarvis. Installation guides, API reference, configuration, and tutorials."
      },
      sidebar: {
        title: "Documentation",
        sections: [
          {
            title: "Getting Started",
            items: [
              { slug: "", title: "Introduction", icon: "🏠" },
              { slug: "quickstart", title: "Quick Start", icon: "🚀" },
              { slug: "install", title: "Installation", icon: "⚙️" },
              { slug: "requirements", title: "Requirements", icon: "📋" },
              { slug: "personas", title: "Personas", icon: "🎭" }
            ]
          },
          {
            title: "Support",
            items: [
              { slug: "troubleshooting", title: "Troubleshooting", icon: "🔧" }
            ]
          }
        ]
      },
      pages: {
        index: {
          title: "MyLittleJarvis Documentation",
          subtitle: "Transform your old smartphone into an AI-powered personal assistant.",
          sections: [
            {
              title: "🚀 Getting Started",
              description: "New to MyLittleJarvis? Start here.",
              links: [
                { title: "Quick Start", slug: "quickstart", desc: "Get up and running in 3 minutes" },
                { title: "Installation", slug: "install", desc: "Detailed installation instructions" }
              ]
            }
          ]
        },
        personas: {
          title: "Personas",
          icon: "🎭",
          content: "Switch between different AI personalities to match your workflow."
        },
        troubleshooting: {
          title: "Troubleshooting",
          icon: "🔧",
          content: "Solutions to common issues and errors with MyLittleJarvis."
        }
      }
    },
    footer: {
      brand: "MyLittleJarvis",
      description: "Your old phone becomes your JARVIS.",
      copyright: "© 2025 MyLittleJarvis. All rights reserved.",
      links: {
        product: ["Documentation", "Changelog", "FAQ"],
        resources: ["Blog", "About", "GitHub"],
        connect: ["Discord", "Twitter", "Email"]
      }
    }
  }
}
