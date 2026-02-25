/**
 * Generate _meta.json files from central config
 * Run: npx ts-node scripts/generate-meta.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { docsConfig, DocSection } from "../lib/docs/config";

const CONTENT_DIR = join(process.cwd(), "content", "docs");

function generateSectionMeta(section: DocSection) {
  return {
    title: section.title,
    description: section.description,
    icon: section.icon,
    defaultOpen: section.defaultOpen,
    pages: section.pages.map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      icon: p.icon,
    })),
  };
}

function generateRootMeta() {
  return {
    title: docsConfig.title,
    description: docsConfig.description,
    sections: docsConfig.sections.map((s) => ({
      title: s.title,
      description: s.description,
      icon: s.icon,
      defaultOpen: s.defaultOpen,
      slug: s.slug,
      pages: s.pages.filter(p => !p.hidden).map((p) => p.slug),
    })),
  };
}

function main() {
  // Ensure content directory exists
  mkdirSync(CONTENT_DIR, { recursive: true });

  // Generate root _meta.json
  const rootMeta = generateRootMeta();
  writeFileSync(
    join(CONTENT_DIR, "_meta.json"),
    JSON.stringify(rootMeta, null, 2)
  );
  console.log("✓ Generated: content/docs/_meta.json");

  // Generate section _meta.json files
  for (const section of docsConfig.sections) {
    const sectionDir = join(CONTENT_DIR, section.slug);
    mkdirSync(sectionDir, { recursive: true });

    const sectionMeta = generateSectionMeta(section);
    writeFileSync(
      join(sectionDir, "_meta.json"),
      JSON.stringify(sectionMeta, null, 2)
    );
    console.log(`✓ Generated: content/docs/${section.slug}/_meta.json`);
  }

  console.log("\n✅ All meta files generated from central config!");
  console.log("📍 Edit lib/docs/config.ts to manage documentation structure");
}

main();
