const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const SRC_DIR = path.join(__dirname, 'schema-src');
const MAIN_FILE = path.join(SRC_DIR, 'main.yaml');
const COMP_DIR = path.join(SRC_DIR, 'components');
const OUTPUT_FILE = path.join(__dirname, 'public/main-bundled.yaml');

function bundle() {
  try {
    console.log('📦 Bundling schema files...');

    if (!fs.existsSync(MAIN_FILE)) {
      console.error(`❌ File not found: ${MAIN_FILE}`);
      return;
    }

    const allComponents = [];
    const allLinks = [];
    const visited = new Set();

    function extractComponents(parsedDoc) {
      if (!parsedDoc) return [];
      if (Array.isArray(parsedDoc)) {
        return parsedDoc.flatMap(extractComponents);
      }
      const comps = [];
      if (parsedDoc.components && Array.isArray(parsedDoc.components)) {
        comps.push(...parsedDoc.components.filter(c => c && typeof c === 'object'));
      }
      if (parsedDoc.id && parsedDoc.type) {
        comps.push(parsedDoc);
      }
      return comps;
    }

    function extractLinks(parsedDoc) {
      if (!parsedDoc) return [];
      if (Array.isArray(parsedDoc)) {
        return parsedDoc.flatMap(extractLinks);
      }
      const links = [];
      if (parsedDoc.links && Array.isArray(parsedDoc.links)) {
        links.push(...parsedDoc.links.filter(l => l && typeof l === 'object'));
      }
      return links;
    }

    function resolveFile(filePath) {
      const absolutePath = path.resolve(filePath);
      if (visited.has(absolutePath)) return null;
      visited.add(absolutePath);

      if (!fs.existsSync(absolutePath)) {
        throw new Error(`File not found: ${absolutePath}`);
      }

      const content = fs.readFileSync(absolutePath, 'utf8');
      let doc;
      if (absolutePath.endsWith('.json')) {
        doc = JSON.parse(content);
      } else {
        doc = yaml.load(content);
      }

      if (!doc) return null;

      // Extract inline components and links
      if (Array.isArray(doc)) {
        for (const item of doc) {
          if (item && typeof item === 'object') {
            if (item.id && item.type) {
              allComponents.push(item);
            } else {
              allComponents.push(...extractComponents(item));
              allLinks.push(...extractLinks(item));
            }
          }
        }
      } else {
        if (doc.components && Array.isArray(doc.components)) {
          const inlineComps = doc.components.filter(c => c && typeof c === 'object');
          allComponents.push(...inlineComps);
        }
        if (doc.links && Array.isArray(doc.links)) {
          allLinks.push(...doc.links);
        }
        if (doc.id && doc.type) {
          allComponents.push(doc);
        }
      }

      // Collect references
      const references = [];
      if (!Array.isArray(doc)) {
        if (doc.resources && Array.isArray(doc.resources)) {
          references.push(...doc.resources.filter(r => typeof r === 'string'));
        }
        if (doc.imports && Array.isArray(doc.imports)) {
          references.push(...doc.imports.filter(r => typeof r === 'string'));
        }
        if (doc.include && Array.isArray(doc.include)) {
          references.push(...doc.include.filter(r => typeof r === 'string'));
        }
        if (doc.components && Array.isArray(doc.components)) {
          references.push(...doc.components.filter(c => typeof c === 'string'));
        }
      }

      // Resolve references relative to current file's directory
      const currentDir = path.dirname(absolutePath);
      for (const ref of references) {
        const resolvedPath = path.resolve(currentDir, ref);
        resolveFile(resolvedPath);
      }

      return doc;
    }

    const mainDoc = resolveFile(MAIN_FILE);
    if (!mainDoc) {
      console.error('❌ Main file could not be parsed.');
      return;
    }

    // Fallback: If only the main file was visited, fall back to old behavior
    if (visited.size === 1) {
      if (fs.existsSync(COMP_DIR)) {
        const files = fs.readdirSync(COMP_DIR);
        let count = 0;
        for (const file of files) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(COMP_DIR, file);
            const content = fs.readFileSync(filePath, 'utf8');
            const compDoc = yaml.load(content);
            if (compDoc) {
              allComponents.push(...extractComponents(compDoc));
              allLinks.push(...extractLinks(compDoc));
              count++;
            }
          }
        }
        console.log(`✅ Fallback: Loaded ${count} components from components/ folder.`);
      }
    }

    // De-duplicate components by ID
    const uniqueComponents = [];
    const seenCompIds = new Set();
    for (const comp of allComponents) {
      if (comp && comp.id) {
        if (!seenCompIds.has(comp.id)) {
          seenCompIds.add(comp.id);
          uniqueComponents.push(comp);
        }
      } else if (comp) {
        uniqueComponents.push(comp);
      }
    }

    // De-duplicate links by ID
    const uniqueLinks = [];
    const seenLinkIds = new Set();
    for (const link of allLinks) {
      if (link && link.id) {
        if (!seenLinkIds.has(link.id)) {
          seenLinkIds.add(link.id);
          uniqueLinks.push(link);
        }
      } else if (link) {
        uniqueLinks.push(link);
      }
    }

    const finalDoc = { ...mainDoc };
    finalDoc.components = uniqueComponents;
    finalDoc.links = uniqueLinks;

    // Write output file to public/sample.yaml
    const bundledYaml = yaml.dump(finalDoc, { noRefs: true, lineWidth: -1 });
    
    // Ensure output directory exists (public/)
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(OUTPUT_FILE, bundledYaml, 'utf8');
    console.log(`🚀 Bundled schema successfully saved to: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('❌ Error bundling schema:', err);
  }
}

bundle();
