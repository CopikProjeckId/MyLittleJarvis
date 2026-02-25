/**
 * N9N Docs - Central Content Management System
 * All documentation metadata is managed from this single file
 */

export interface DocPage {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  hidden?: boolean;
}

export interface DocSection {
  slug: string;
  title: string;
  description?: string;
  icon?: string;
  defaultOpen?: boolean;
  pages: DocPage[];
}

export interface DocConfig {
  title: string;
  description: string;
  sections: DocSection[];
}

// ==========================================
// CENTRAL DOCUMENTATION CONFIGURATION
// Edit this to manage all docs structure
// ==========================================
export const docsConfig: DocConfig = {
  title: "MyLittleJarvis Docs",
  description: "Transform your old phone into an AI assistant",
  sections: [
    {
      slug: "getting-started",
      title: "Getting Started",
      description: "Learn the basics of JARVIS",
      icon: "🚀",
      defaultOpen: true,
      pages: [
        { slug: "index", title: "Overview", description: "Introduction to MyLittleJarvis", icon: "🏠" },
        { slug: "installation", title: "Installation", description: "Install on your device", icon: "💻" },
        { slug: "quickstart", title: "Quick Start", description: "Get running in 15 minutes", icon: "⚡" },
        { slug: "configuration", title: "Configuration", description: "Customize your setup", icon: "⚙️" },
      ],
    },
    {
      slug: "reference",
      title: "Reference",
      description: "API and CLI reference documentation",
      icon: "📖",
      defaultOpen: false,
      pages: [
        { slug: "api", title: "API Reference", description: "Core API documentation", icon: "🔌" },
        { slug: "cli-commands", title: "CLI Commands", description: "Command line reference", icon: "⌨️" },
        { slug: "architecture", title: "Architecture", description: "System design docs", icon: "🏗️" },
      ],
    },
    {
      slug: "examples",
      title: "Examples",
      description: "Real-world use cases and workflows",
      icon: "💡",
      defaultOpen: false,
      pages: [
        { slug: "index", title: "Overview", description: "Example gallery", icon: "📋" },
        { slug: "coding-assistant", title: "Coding Assistant", description: "Code with AI help", icon: "💻" },
        { slug: "task-automation", title: "Task Automation", description: "Automate your tasks", icon: "🤖" },
      ],
    },
    {
      slug: "advanced",
      title: "Advanced",
      description: "Deep dive into advanced features",
      icon: "🔧",
      defaultOpen: false,
      pages: [
        { slug: "custom-models", title: "Custom Models", description: "Use your own LLMs", icon: "🧠" },
        { slug: "plugins", title: "Plugins", description: "Extend functionality", icon: "🔌" },
        { slug: "self-hosting", title: "Self Hosting", description: "Host your own server", icon: "🖥️" },
      ],
    },
  ],
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/** Get all pages for search indexing */
export function getAllPages(): (DocPage & { sectionSlug: string; sectionTitle: string })[] {
  const pages: (DocPage & { sectionSlug: string; sectionTitle: string })[] = [];
  
  for (const section of docsConfig.sections) {
    for (const page of section.pages) {
      if (!page.hidden) {
        pages.push({
          ...page,
          sectionSlug: section.slug,
          sectionTitle: section.title,
        });
      }
    }
  }
  
  return pages;
}

/** Get section by slug */
export function getSection(slug: string): DocSection | undefined {
  return docsConfig.sections.find((s) => s.slug === slug);
}

/** Get page by section and slug */
export function getPage(sectionSlug: string, pageSlug: string): DocPage | undefined {
  const section = getSection(sectionSlug);
  return section?.pages.find((p) => p.slug === pageSlug);
}

/** Get navigation breadcrumbs */
export function getBreadcrumbs(sectionSlug: string, pageSlug: string) {
  const section = getSection(sectionSlug);
  const page = getPage(sectionSlug, pageSlug);
  
  if (!section || !page) return [];
  
  return [
    { title: "Docs", href: "/docs" },
    { title: section.title, href: `/docs/${section.slug}` },
    { title: page.title, href: `/docs/${section.slug}/${page.slug}` },
  ];
}

/** Get previous/next page for pagination */
export function getPrevNext(sectionSlug: string, pageSlug: string) {
  const allPages = getAllPages();
  const currentIndex = allPages.findIndex(
    (p) => p.sectionSlug === sectionSlug && p.slug === pageSlug
  );
  
  return {
    prev: currentIndex > 0 ? allPages[currentIndex - 1] : null,
    next: currentIndex < allPages.length - 1 ? allPages[currentIndex + 1] : null,
  };
}

/** Generate search index */
export function generateSearchIndex() {
  return getAllPages().map((page) => ({
    id: `${page.sectionSlug}/${page.slug}`,
    title: page.title,
    description: page.description || "",
    section: page.sectionTitle,
    href: `/docs/${page.sectionSlug}/${page.slug}`,
  }));
}
