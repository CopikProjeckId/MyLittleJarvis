// 타입만 분리 - 클라이언트/서버 공용

export interface SiteConfig {
  site: {
    name: string
    tagline: string
    description: string
  }
  navigation: Record<string, string>
  home: {
    hero: Record<string, string>
    features: {
      title: string
      subtitle: string
      cards: Array<{
        icon: string
        title: string
        description: string
      }>
    }
    terminal: {
      title: string
      subtitle: string
      steps: string[]
    }
    installation: {
      title: string
      steps: Array<{
        number: string
        title: string
        desc: string
      }>
    }
  }
  about: {
    hero: Record<string, string>
    mission: {
      title: string
      paragraphs: string[]
      stats: Array<{ value: string; label: string }>
    }
    team: {
      title: string
      members: Array<{
        name: string
        role: string
        desc: string
      }>
    }
    values: {
      title: string
      items: Array<{
        icon: string
        title: string
        desc: string
      }>
    }
  }
  faq: {
    hero: Record<string, string>
    questions: Array<{
      question: string
      answer: string
    }>
    cta: Record<string, string>
  }
  blog: {
    meta: {
      title: string
      description: string
    }
    hero: Record<string, string>
    filters: string[]
    newsletter: {
      title: string
      subtitle: string
      placeholder: string
      button: string
    }
    posts: Array<{
      slug: string
      title: string
      excerpt: string
      date: string
      category: string
      readTime: string
      featured: boolean
    }>
  }
  changelog: {
    meta: {
      title: string
      description: string
    }
    hero: {
      badge: string
      badgeText: string
      title: string
      titleHighlight: string
      subtitle: string
      feedLinkText: string
      subtitleSuffix: string
    }
    releases: Array<{
      version: string
      date: string
      tag: string | null
      tagColor: string
      changes: Array<{
        type: string
        text: string
      }>
    }>
  }
  docs: {
    meta: {
      title: string
      description: string
    }
    sidebar: {
      title: string
      sections: Array<{
        title: string
        collapsed?: boolean
        items: Array<{
          slug: string
          title: string
          icon: string
        }>
      }>
    }
    pages: {
      index: {
        title: string
        subtitle: string
        sections: Array<{
          title: string
          description: string
          links: Array<{
            title: string
            slug: string
            desc: string
          }>
        }>
      }
      [key: string]: {
        title: string
        subtitle?: string
        sections?: Array<{
          title: string
          description: string
          links: Array<{
            title: string
            slug: string
            desc: string
          }>
        }>
        icon?: string
        content?: string
      }
    }
  }
  footer: {
    brand: string
    description: string
    copyright: string
    links: {
      product: string[]
      resources: string[]
      connect: string[]
    }
  }
}

export interface DocsSidebarSection {
  title: string
  collapsed?: boolean
  items: Array<{
    slug: string
    title: string
    icon: string
  }>
}

export interface DocsSidebarItem {
  slug: string
  title: string
  icon: string
}

export interface DocsIndexSection {
  title: string
  description: string
  links: Array<{
    title: string
    slug: string
    desc: string
  }>
}
