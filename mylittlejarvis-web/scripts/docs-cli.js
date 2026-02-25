#!/usr/bin/env node

/**
 * CLI for managing N9N Docs
 * Usage: node scripts/docs-cli.js <command>
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(process.cwd(), 'content', 'docs');
const CONFIG_PATH = path.join(process.cwd(), 'lib', 'docs', 'config.ts');

const COMMANDS = {
  list: 'List all sections and pages',
  add: 'Add a new page (interactive)',
  remove: 'Remove a page',
  validate: 'Validate documentation structure',
  help: 'Show this help message',
};

function showHelp() {
  console.log('\n📚 N9N Docs CLI\n');
  console.log('Usage: node scripts/docs-cli.js <command>\n');
  console.log('Commands:');
  for (const [cmd, desc] of Object.entries(COMMANDS)) {
    console.log(`  ${cmd.padEnd(10)} ${desc}`);
  }
  console.log('');
}

function listDocs() {
  // Read from _meta.json files
  const rootMeta = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_meta.json'), 'utf8'));
  
  console.log('\n📚 Documentation Structure\n');
  console.log(`${rootMeta.title}\n${rootMeta.description}\n`);
  
  for (const section of rootMeta.sections) {
    console.log(`${section.icon} ${section.title}`);
    console.log(`  /docs/${section.slug}/`);
    
    const sectionMetaPath = path.join(CONTENT_DIR, section.slug, '_meta.json');
    if (fs.existsSync(sectionMetaPath)) {
      const sectionMeta = JSON.parse(fs.readFileSync(sectionMetaPath, 'utf8'));
      for (const page of sectionMeta.pages) {
        const status = fs.existsSync(path.join(CONTENT_DIR, section.slug, `${page.slug}.md`)) 
          ? '✓' : '✗';
        console.log(`    ${status} ${page.icon || '•'} ${page.title} (${page.slug})`);
      }
    }
    console.log('');
  }
}

function validateDocs() {
  let errors = [];
  let warnings = [];
  
  const rootMeta = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, '_meta.json'), 'utf8'));
  
  for (const section of rootMeta.sections) {
    const sectionDir = path.join(CONTENT_DIR, section.slug);
    
    // Check section directory exists
    if (!fs.existsSync(sectionDir)) {
      errors.push(`Missing directory: content/docs/${section.slug}/`);
      continue;
    }
    
    // Check section _meta.json exists
    const sectionMetaPath = path.join(sectionDir, '_meta.json');
    if (!fs.existsSync(sectionMetaPath)) {
      errors.push(`Missing _meta.json: content/docs/${section.slug}/_meta.json`);
      continue;
    }
    
    // Check all pages exist
    const sectionMeta = JSON.parse(fs.readFileSync(sectionMetaPath, 'utf8'));
    for (const page of sectionMeta.pages) {
      const pagePath = path.join(sectionDir, `${page.slug}.md`);
      if (!fs.existsSync(pagePath)) {
        warnings.push(`Missing page: content/docs/${section.slug}/${page.slug}.md`);
      }
    }
  }
  
  console.log('\n📋 Validation Results\n');
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All documentation files are valid!\n');
    return;
  }
  
  if (errors.length > 0) {
    console.log('❌ Errors:');
    for (const err of errors) {
      console.log(`   ${err}`);
    }
    console.log('');
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    for (const warn of warnings) {
      console.log(`   ${warn}`);
    }
    console.log('');
  }
}

function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'list':
      listDocs();
      break;
    case 'validate':
      validateDocs();
      break;
    case 'help':
    default:
      showHelp();
      break;
  }
}

main();
